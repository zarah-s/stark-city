#[starknet::interface]
pub trait IActions<IWorldDispatcher> {
    fn create_game(ref self: IWorldDispatcher, game_id: u32);
    fn join_game(ref self: IWorldDispatcher, game_id: u32, piece: u8);
    fn start_game(ref self: IWorldDispatcher, game_id: u32);
    fn roll_dice(ref self: IWorldDispatcher, game_id: u32, dice1: u8, dice2: u8);
    fn buy_property(ref self: IWorldDispatcher, game_id: u32, position: u8);
    fn buy_house(ref self: IWorldDispatcher, game_id: u32, position: u8);
    fn sell_house(ref self: IWorldDispatcher, game_id: u32, position: u8);
    fn next_turn(ref self: IWorldDispatcher, game_id: u32);
    fn pay_rent(ref self: IWorldDispatcher, game_id: u32, property_position: u8);
}

#[dojo::contract]
mod actions {
    use core::num::traits::Zero;
    use dojo::event::EventStorage;
    use dojo::model::ModelStorage;
    use starkcity::models::{Game, GameMove, Player, Property};
    use starknet::{ContractAddress, get_block_timestamp, get_caller_address};
    use super::{IActions, calculate_rent};

    #[abi(embed_v0)]
    impl ActionsImpl of IActions<ContractState> {
        fn create_game(ref self: ContractState, game_id: u32) {
            let mut world = self.world_default();
            let caller = get_caller_address();

            let game = Game {
                game_id,
                host: caller,
                started: false,
                current_player: 0,
                player_count: 0,
                winner: 0.try_into().unwrap(),
            };
            world.write_model(@game);

            // Initialize all properties
            self.initialize_properties(game_id);

            world.emit_event(@GameCreated { game_id, host: caller });
        }

        fn join_game(ref self: ContractState, game_id: u32, piece: u8) {
            let mut world = self.world_default();

            let caller = get_caller_address();
            let mut game: Game = world.read_model(game_id);

            assert(!game.started, 'GAME_STARTED_ALREADY');
            assert(game.player_count < 4, 'Game is full');

            let player = Player {
                game_id,
                player_address: caller,
                player_id: game.player_count,
                position: 0,
                money: 1500,
                piece,
                is_active: true,
            };
            world.write_model(@player);

            // set!(world, (player));

            game.player_count += 1;
            world.write_model(@game);
            // set!(world, (game));

            world
                .emit_event(
                    @PlayerJoined { game_id, player: caller, player_id: game.player_count - 1 },
                );
        }

        fn start_game(ref self: ContractState, game_id: u32) {
            let mut world = self.world_default();

            let caller = get_caller_address();
            let mut game: Game = world.read_model(game_id);

            assert(caller == game.host, 'Only host can start');
            assert(game.player_count >= 2, 'Need at least 2 players');
            assert(!game.started, 'GAME_STARTED_ALREADY');

            game.started = true;
            game.current_player = 0;
            world.write_model(@game);

            world.emit_event(@GameStarted { game_id, started: true });
        }

        fn roll_dice(ref self: ContractState, game_id: u32, dice1: u8, dice2: u8) {
            let mut world = self.world_default();

            let caller = get_caller_address();
            let game: Game = world.read_model(game_id);
            let mut player: Player = world.read_model((game_id, caller));

            assert(game.started, 'Game not started');
            assert(player.player_id == game.current_player, 'Not your turn');
            assert(dice1 >= 1 && dice1 <= 6, 'Invalid dice1');
            assert(dice2 >= 1 && dice2 <= 6, 'Invalid dice2');

            let total = dice1 + dice2;
            let mut new_position = player.position + total;

            // Pass GO - collect $200
            if new_position >= 40 {
                player.money += 200;
                new_position = new_position % 40;
            }

            player.position = new_position;
            world.write_model(@player);

            // Record the move
            let move_count = self.get_move_count(game_id);
            let game_move = GameMove {
                game_id,
                move_id: move_count,
                player: caller,
                dice1,
                dice2,
                new_position,
                timestamp: get_block_timestamp(),
            };
            world.write_model(@game_move);
            world.emit_event(@DiceRolled { game_id, player: caller, dice1, dice2 });
        }

        fn buy_property(ref self: ContractState, game_id: u32, position: u8) {
            let caller = get_caller_address();
            let mut world = self.world_default();

            let mut player: Player = world.read_model((game_id, caller));
            let mut property: Property = world.read_model((game_id, position));

            assert(player.position == position, 'Not on this property');
            assert(property.owner.is_zero(), 'Already owned');
            assert(player.money >= property.price, 'Not enough money');

            player.money -= property.price;
            property.owner = caller;
            world.write_model(@player);
            world.write_model(@property);
            world
                .emit_event(
                    @PropertyPurchased { game_id, player: caller, position, price: property.price },
                );
        }

        fn buy_house(ref self: ContractState, game_id: u32, position: u8) {
            let caller = get_caller_address();
            let mut world = self.world_default();

            let mut player: Player = world.read_model((game_id, caller));
            let mut property: Property = world.read_model((game_id, position));

            assert(property.owner == caller, 'Not your property');
            assert(property.houses < 5, 'Max 5 houses/hotel');
            assert(player.money >= property.house_price, 'Not enough money');
            assert(
                self.owns_monopoly(game_id, caller, property.color_group), 'Need color monopoly',
            );

            player.money -= property.house_price;
            property.houses += 1;
            world.write_model(@player);
            world.write_model(@property);
            world
                .emit_event(
                    @HouseBought { game_id, player: caller, position, houses: property.houses },
                );
        }

        fn sell_house(ref self: ContractState, game_id: u32, position: u8) {
            let caller = get_caller_address();
            let mut world = self.world_default();

            let mut player: Player = world.read_model((game_id, caller));
            let mut property: Property = world.read_model((game_id, position));

            assert(property.owner == caller, 'Not your property');
            assert(property.houses > 0, 'No houses to sell');

            let sell_price = property.house_price / 2;
            player.money += sell_price;
            property.houses -= 1;
            world.write_model(@player);
            world.write_model(@property);
            world
                .emit_event(
                    @HouseSold {
                        game_id,
                        player: caller,
                        position,
                        houses: property.houses,
                        price: sell_price,
                    },
                );
        }

        fn next_turn(ref self: ContractState, game_id: u32) {
            let mut world = self.world_default();

            let mut game: Game = world.read_model(game_id);

            game.current_player = (game.current_player + 1) % game.player_count;
            world.write_model(@game);

            world.emit_event(@TurnChanged { game_id, current_player: game.current_player });
        }

        fn pay_rent(ref self: ContractState, game_id: u32, property_position: u8) {
            let mut world = self.world_default();

            let caller = get_caller_address();
            let mut player: Player = world.read_model((game_id, caller));
            let property: Property = world.read_model((game_id, property_position));

            assert(!property.owner.is_zero(), 'Property not owned');
            assert(property.owner != caller, 'You own this property');

            // Calculate rent based on houses
            let rent = calculate_rent(property.rent_base, property.houses);

            assert(player.money >= rent, 'Not enough money for rent');

            player.money -= rent;
            let mut owner: Player = world.read_model((game_id, property.owner));
            owner.money += rent;
            world.write_model(@player);
            world.write_model(@owner);

            world
                .emit_event(
                    @RentPaid {
                        game_id,
                        from: caller,
                        to: property.owner,
                        amount: rent,
                        position: property_position,
                    },
                );
        }
    }

    // Events
    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct GameCreated {
        #[key]
        pub game_id: u32,
        pub host: ContractAddress,
    }

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct PlayerJoined {
        #[key]
        pub game_id: u32,
        pub player: ContractAddress,
        pub player_id: u8,
    }

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct GameStarted {
        #[key]
        pub game_id: u32,
        pub started: bool,
    }

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct DiceRolled {
        #[key]
        pub game_id: u32,
        pub player: ContractAddress,
        pub dice1: u8,
        pub dice2: u8,
    }

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct PropertyPurchased {
        #[key]
        pub game_id: u32,
        pub player: ContractAddress,
        pub position: u8,
        pub price: u32,
    }

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct HouseBought {
        #[key]
        pub game_id: u32,
        pub player: ContractAddress,
        pub position: u8,
        pub houses: u8,
    }

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct HouseSold {
        #[key]
        pub game_id: u32,
        pub player: ContractAddress,
        pub position: u8,
        pub houses: u8,
        pub price: u32,
    }

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct TurnChanged {
        #[key]
        pub game_id: u32,
        pub current_player: u8,
    }

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct RentPaid {
        #[key]
        pub game_id: u32,
        pub from: ContractAddress,
        pub to: ContractAddress,
        pub amount: u32,
        pub position: u8,
    }

    // Internal Helper Functions
    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@"starkcity")
        }
        fn initialize_properties(self: @ContractState, game_id: u32) {
            let mut world = self.world_default();

            let zero_addr = 0.try_into().unwrap();

            // Array of properties: (position, price, rent, house_price, color_group)
            let properties = array![
                (1_u8, 60_u32, 2_u32, 50_u32, 1_u8), // Mediterranean Avenue
                (3, 60, 4, 50, 1), // Baltic Avenue
                (6, 100, 6, 50, 2), // Oriental Avenue
                (8, 100, 6, 50, 2), // Vermont Avenue
                (9, 120, 8, 50, 2), // Connecticut Avenue
                (11, 140, 10, 100, 3), // St. Charles Place
                (13, 140, 10, 100, 3), // States Avenue
                (14, 160, 12, 100, 3), // Virginia Avenue
                (16, 180, 14, 100, 4), // St. James Place
                (18, 180, 14, 100, 4), // Tennessee Avenue
                (19, 200, 16, 100, 4), // New York Avenue
                (21, 220, 18, 150, 5), // Kentucky Avenue
                (23, 220, 18, 150, 5), // Indiana Avenue
                (24, 240, 20, 150, 5), // Illinois Avenue
                (26, 260, 22, 150, 6), // Atlantic Avenue
                (27, 260, 22, 150, 6), // Ventnor Avenue
                (29, 280, 24, 150, 6), // Marvin Gardens
                (31, 300, 26, 200, 7), // Pacific Avenue
                (32, 300, 26, 200, 7), // North Carolina Avenue
                (34, 320, 28, 200, 7), // Pennsylvania Avenue
                (37, 350, 35, 200, 8), // Park Place
                (39, 400, 50, 200, 8) // Boardwalk
            ];

            let mut i: u32 = 0;
            let len = properties.len();

            while i < len {
                let (pos, price, rent, house_price, color) = *properties.at(i);

                let property = Property {
                    game_id,
                    position: pos,
                    owner: zero_addr,
                    houses: 0,
                    price,
                    rent_base: rent,
                    house_price,
                    color_group: color,
                };

                world.write_model(@property);
                // set!(world, (property));
                i += 1;
            };
        }

        fn owns_monopoly(
            self: @ContractState, game_id: u32, player: ContractAddress, color_group: u8,
        ) -> bool {
            let mut world = self.world_default();

            // Number of properties in each color group
            let color_counts = array![0, 2, 3, 3, 3, 3, 3, 3, 2];
            let required: u32 = (*color_counts.at(color_group.into())).try_into().unwrap();

            let mut owned: u32 = 0;
            let mut pos: u8 = 1;

            while pos < 40 {
                let property: Property = world.read_model((game_id, pos));
                if property.color_group == color_group && property.owner == player {
                    owned += 1;
                }
                pos += 1;
            }

            owned == required
        }

        fn get_move_count(self: @ContractState, game_id: u32) -> u32 {
            let mut count: u32 = 0;
            let mut i: u32 = 0;
            let mut world = self.world_default();

            while i < 1000 {
                let game_move: GameMove = world.read_model((game_id, i));
                if game_move.timestamp == 0 {
                    break;
                }
                count += 1;
                i += 1;
            }

            count
        }
    }
}

fn calculate_rent(base_rent: u32, houses: u8) -> u32 {
    // Rent multipliers based on houses
    // 0 houses: 1x, 1 house: 5x, 2 houses: 15x, 3 houses: 45x, 4 houses: 80x, hotel: 125x
    let multipliers = array![1_u32, 5, 15, 45, 80, 125];
    let multiplier = *multipliers.at(houses.into());
    base_rent * multiplier
}
