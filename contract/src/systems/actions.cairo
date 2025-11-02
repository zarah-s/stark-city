use starknet::ContractAddress;

#[starknet::interface]
pub trait IActions<TContractState> {
    fn create_game(ref self: TContractState, game_id: felt252);
    fn join_game(ref self: TContractState, game_id: felt252, piece: u8);
    fn start_game(ref self: TContractState, game_id: felt252);
    fn roll_dice(ref self: TContractState, game_id: felt252) -> (u8, u8);
    fn buy_property(ref self: TContractState, game_id: felt252, position: u8);
    fn buy_house(ref self: TContractState, game_id: felt252, position: u8);
    fn sell_house(ref self: TContractState, game_id: felt252, position: u8);
    fn mortgage_property(ref self: TContractState, game_id: felt252, position: u8);
    fn unmortgage_property(ref self: TContractState, game_id: felt252, position: u8);
    fn next_turn(ref self: TContractState, game_id: felt252);
    fn pay_rent(ref self: TContractState, game_id: felt252, property_position: u8);
    fn use_jail_free_card(ref self: TContractState, game_id: felt252);
    fn pay_to_leave_jail(ref self: TContractState, game_id: felt252);
    fn declare_bankruptcy(ref self: TContractState, game_id: felt252);
    fn set_nft_contract(ref self: TContractState, nft_contract: ContractAddress);
    fn set_owner(ref self: TContractState, owner: ContractAddress);
}

#[dojo::contract]
mod actions {
    use core::num::traits::Zero;
    use dojo::event::EventStorage;
    use dojo::model::ModelStorage;
    use starkcity::models::{Game, GameMove, Player, Property};
    use starkcity::tokens::erc1155::{IERC1155Dispatcher, IERC1155DispatcherTrait};
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use starknet::{ContractAddress, get_block_timestamp, get_caller_address, get_tx_info};
    use super::{IActions, calculate_rent};

    #[storage]
    struct Storage {
        nft_contract: ContractAddress,
        owner: ContractAddress,
    }

    #[abi(embed_v0)]
    impl ActionsImpl of IActions<ContractState> {
        fn create_game(ref self: ContractState, game_id: felt252) {
            let mut world = self.world_default();
            let caller = get_caller_address();

            let game = Game {
                game_id,
                host: caller,
                started: false,
                current_player: 0,
                player_count: 0,
                winner: Zero::zero(),
                turn_timeout: 30 // 30 seconds per turn
            };
            world.write_model(@game);

            // Initialize all properties
            self.initialize_properties(game_id);

            world.emit_event(@GameCreated { game_id, host: caller });
        }

        fn join_game(ref self: ContractState, game_id: felt252, piece: u8) {
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
                bankrupt: false,
                in_jail: false,
                jail_turns: 0,
                get_out_jail_free: 0,
            };
            world.write_model(@player);

            game.player_count += 1;
            world.write_model(@game);

            world
                .emit_event(
                    @PlayerJoined { game_id, player: caller, player_id: game.player_count - 1 },
                );
        }

        fn start_game(ref self: ContractState, game_id: felt252) {
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

        fn roll_dice(ref self: ContractState, game_id: felt252) -> (u8, u8) {
            let mut world = self.world_default();
            let caller = get_caller_address();
            let game: Game = world.read_model(game_id);
            let mut player: Player = world.read_model((game_id, caller));

            assert(game.started, 'Game not started');

            // Generate pseudo-random dice using block timestamp and transaction hash
            let tx_info = get_tx_info().unbox();
            let seed: u256 = get_block_timestamp().into() + tx_info.transaction_hash.into();

            let die1: u8 = ((seed % 6) + 1).try_into().unwrap();
            let die2: u8 = (((seed / 7) % 6) + 1).try_into().unwrap();

            // Handle jail logic
            if player.in_jail {
                if die1 == die2 {
                    // Rolled doubles - get out of jail
                    player.in_jail = false;
                    player.jail_turns = 0;
                } else {
                    player.jail_turns += 1;
                    if player.jail_turns >= 3 {
                        // Force pay to leave after 3 turns
                        player.in_jail = false;
                        player.jail_turns = 0;
                        player.money -= 50;
                    } else {
                        // Still in jail
                        world.write_model(@player);
                        world
                            .emit_event(
                                @DiceRolled {
                                    game_id,
                                    player: caller,
                                    dice1: die1,
                                    dice2: die2,
                                    still_in_jail: true,
                                },
                            );
                        return (die1, die2);
                    }
                }
            }

            let total = die1 + die2;
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
                dice1: die1,
                dice2: die2,
                new_position,
                timestamp: get_block_timestamp(),
            };
            world.write_model(@game_move);

            world
                .emit_event(
                    @DiceRolled {
                        game_id, player: caller, dice1: die1, dice2: die2, still_in_jail: false,
                    },
                );

            (die1, die2)
        }

        fn buy_property(ref self: ContractState, game_id: felt252, position: u8) {
            let caller = get_caller_address();
            let mut world = self.world_default();

            let mut player: Player = world.read_model((game_id, caller));
            let mut property: Property = world.read_model((game_id, position));

            assert(property.owner.is_zero(), 'Already owned');
            assert(player.money >= property.price, 'Not enough money');

            player.money -= property.price;
            property.owner = caller;
            world.write_model(@player);
            world.write_model(@property);

            // 🎯 MINT PROPERTY NFT
            let nft = IERC1155Dispatcher { contract_address: self.nft_contract.read() };
            let token_id: u256 = position.into();
            nft.mint(caller, token_id, 1);

            world
                .emit_event(
                    @PropertyPurchased { game_id, player: caller, position, price: property.price },
                );
        }

        fn buy_house(ref self: ContractState, game_id: felt252, position: u8) {
            let caller = get_caller_address();
            let mut world = self.world_default();

            let mut player: Player = world.read_model((game_id, caller));
            let mut property: Property = world.read_model((game_id, position));

            assert(property.owner == caller, 'Not your property');
            assert(property.houses < 5, 'Max 5 houses/hotel');
            assert(!property.mortgaged, 'Property is mortgaged');
            assert(player.money >= property.house_price, 'Not enough money');
            assert(
                self.owns_monopoly(game_id, caller, property.color_group), 'Need color monopoly',
            );

            player.money -= property.house_price;
            property.houses += 1;
            world.write_model(@player);
            world.write_model(@property);

            // 🏠 MINT HOUSE/HOTEL NFT
            let nft = IERC1155Dispatcher { contract_address: self.nft_contract.read() };

            if property.houses == 5 {
                // Hotel - burn 4 houses, mint 1 hotel
                let house_token_id: u256 = (1000 + position.into()).into();
                nft.burn(caller, house_token_id, 4);

                let hotel_token_id: u256 = (2000 + position.into()).into();
                nft.mint(caller, hotel_token_id, 1);
            } else {
                // Regular house
                let house_token_id: u256 = (1000 + position.into()).into();
                nft.mint(caller, house_token_id, 1);
            }

            world
                .emit_event(
                    @HouseBought { game_id, player: caller, position, houses: property.houses },
                );
        }

        fn sell_house(ref self: ContractState, game_id: felt252, position: u8) {
            let caller = get_caller_address();
            let mut world = self.world_default();

            let mut player: Player = world.read_model((game_id, caller));
            let mut property: Property = world.read_model((game_id, position));

            assert(property.owner == caller, 'Not your property');
            assert(property.houses > 0, 'No houses to sell');

            let nft = IERC1155Dispatcher { contract_address: self.nft_contract.read() };

            if property.houses == 5 {
                // Selling hotel - burn hotel, mint 4 houses
                let hotel_token_id: u256 = (2000 + position.into()).into();
                nft.burn(caller, hotel_token_id, 1);

                let house_token_id: u256 = (1000 + position.into()).into();
                nft.mint(caller, house_token_id, 4);
            } else {
                // Selling regular house
                let house_token_id: u256 = (1000 + position.into()).into();
                nft.burn(caller, house_token_id, 1);
            }

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

        fn mortgage_property(ref self: ContractState, game_id: felt252, position: u8) {
            let caller = get_caller_address();
            let mut world = self.world_default();

            let mut player: Player = world.read_model((game_id, caller));
            let mut property: Property = world.read_model((game_id, position));

            assert(property.owner == caller, 'Not your property');
            assert(!property.mortgaged, 'Already mortgaged');
            assert(property.houses == 0, 'Sell houses first');

            let mortgage_value = property.price / 2;
            player.money += mortgage_value;
            property.mortgaged = true;

            world.write_model(@player);
            world.write_model(@property);

            world
                .emit_event(
                    @PropertyMortgaged { game_id, player: caller, position, value: mortgage_value },
                );
        }

        fn unmortgage_property(ref self: ContractState, game_id: felt252, position: u8) {
            let caller = get_caller_address();
            let mut world = self.world_default();

            let mut player: Player = world.read_model((game_id, caller));
            let mut property: Property = world.read_model((game_id, position));

            assert(property.owner == caller, 'Not your property');
            assert(property.mortgaged, 'Not mortgaged');

            let unmortgage_cost = (property.price * 55) / 100; // 55% of value
            assert(player.money >= unmortgage_cost, 'Not enough money');

            player.money -= unmortgage_cost;
            property.mortgaged = false;

            world.write_model(@player);
            world.write_model(@property);

            world
                .emit_event(
                    @PropertyUnmortgaged {
                        game_id, player: caller, position, cost: unmortgage_cost,
                    },
                );
        }

        fn use_jail_free_card(ref self: ContractState, game_id: felt252) {
            let caller = get_caller_address();
            let mut world = self.world_default();

            let mut player: Player = world.read_model((game_id, caller));

            assert(player.in_jail, 'Not in jail');
            assert(player.get_out_jail_free > 0, 'No card available');

            player.in_jail = false;
            player.jail_turns = 0;
            player.get_out_jail_free -= 1;

            world.write_model(@player);

            world.emit_event(@JailFreeCardUsed { game_id, player: caller });
        }

        fn pay_to_leave_jail(ref self: ContractState, game_id: felt252) {
            let caller = get_caller_address();
            let mut world = self.world_default();

            let mut player: Player = world.read_model((game_id, caller));

            assert(player.in_jail, 'Not in jail');
            assert(player.money >= 50, 'Not enough money');

            player.in_jail = false;
            player.jail_turns = 0;
            player.money -= 50;

            world.write_model(@player);

            world.emit_event(@PaidToLeaveJail { game_id, player: caller, amount: 50 });
        }

        fn declare_bankruptcy(ref self: ContractState, game_id: felt252) {
            let caller = get_caller_address();
            let mut world = self.world_default();

            let mut player: Player = world.read_model((game_id, caller));
            let mut game: Game = world.read_model(game_id);

            assert(player.money < 0, 'Not bankrupt');

            player.bankrupt = true;
            player.is_active = false;

            // Transfer all properties back to bank
            let mut pos: u8 = 0;
            while pos < 40 {
                let mut property: Property = world.read_model((game_id, pos));
                if property.owner == caller {
                    property.owner = Zero::zero();
                    property.houses = 0;
                    property.mortgaged = false;
                    world.write_model(@property);
                }
                pos += 1;
            }

            world.write_model(@player);

            // Check for winner
            let active_players = self.count_active_players(game_id);
            if active_players == 1 {
                game.winner = self.get_last_active_player(game_id);
                world.write_model(@game);

                world.emit_event(@GameWon { game_id, winner: game.winner });
            }

            world.emit_event(@PlayerBankrupt { game_id, player: caller });
        }

        fn next_turn(ref self: ContractState, game_id: felt252) {
            let mut world = self.world_default();
            let mut game: Game = world.read_model(game_id);
            let caller = get_caller_address();
            let player: Player = world.read_model((game_id, caller));

            if player.player_id == game.current_player {
                // Skip bankrupt players
                loop {
                    game.current_player = (game.current_player + 1) % game.player_count;
                    let next_player_addr = self
                        .get_player_address_by_id(game_id, game.current_player);
                    let next_player: Player = world.read_model((game_id, next_player_addr));
                    if !next_player.bankrupt {
                        break;
                    }
                }

                world.write_model(@game);
                world.emit_event(@TurnChanged { game_id, current_player: game.current_player });
            }
        }

        fn pay_rent(ref self: ContractState, game_id: felt252, property_position: u8) {
            let mut world = self.world_default();
            let caller = get_caller_address();
            let mut player: Player = world.read_model((game_id, caller));
            let property: Property = world.read_model((game_id, property_position));

            assert(!property.owner.is_zero(), 'Property not owned');
            assert(property.owner != caller, 'You own this property');
            assert(!property.mortgaged, 'Property is mortgaged');

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

        fn set_nft_contract(ref self: ContractState, nft_contract: ContractAddress) {
            assert(get_caller_address() == self.owner.read(), 'UNAUTHORIZED');
            self.nft_contract.write(nft_contract);
        }

        fn set_owner(ref self: ContractState, owner: ContractAddress) {
            if self.owner.read().is_zero() || self.owner.read() == get_caller_address() {
                self.owner.write(owner);
            }
        }
    }

    // Events
    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct GameCreated {
        #[key]
        pub game_id: felt252,
        pub host: ContractAddress,
    }

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct PlayerJoined {
        #[key]
        pub game_id: felt252,
        pub player: ContractAddress,
        pub player_id: u8,
    }

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct GameStarted {
        #[key]
        pub game_id: felt252,
        pub started: bool,
    }

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct DiceRolled {
        #[key]
        pub game_id: felt252,
        pub player: ContractAddress,
        pub dice1: u8,
        pub dice2: u8,
        pub still_in_jail: bool,
    }

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct PropertyPurchased {
        #[key]
        pub game_id: felt252,
        pub player: ContractAddress,
        pub position: u8,
        pub price: u32,
    }

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct HouseBought {
        #[key]
        pub game_id: felt252,
        pub player: ContractAddress,
        pub position: u8,
        pub houses: u8,
    }

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct HouseSold {
        #[key]
        pub game_id: felt252,
        pub player: ContractAddress,
        pub position: u8,
        pub houses: u8,
        pub price: u32,
    }

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct PropertyMortgaged {
        #[key]
        pub game_id: felt252,
        pub player: ContractAddress,
        pub position: u8,
        pub value: u32,
    }

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct PropertyUnmortgaged {
        #[key]
        pub game_id: felt252,
        pub player: ContractAddress,
        pub position: u8,
        pub cost: u32,
    }

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct JailFreeCardUsed {
        #[key]
        pub game_id: felt252,
        pub player: ContractAddress,
    }

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct PaidToLeaveJail {
        #[key]
        pub game_id: felt252,
        pub player: ContractAddress,
        pub amount: u32,
    }

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct PlayerBankrupt {
        #[key]
        pub game_id: felt252,
        pub player: ContractAddress,
    }

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct GameWon {
        #[key]
        pub game_id: felt252,
        pub winner: ContractAddress,
    }

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct TurnChanged {
        #[key]
        pub game_id: felt252,
        pub current_player: u8,
    }

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct RentPaid {
        #[key]
        pub game_id: felt252,
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

        fn initialize_properties(self: @ContractState, game_id: felt252) {
            let mut world = self.world_default();
            let zero_addr = Zero::zero();

            let properties = array![
                (1_u8, 60_u32, 2_u32, 50_u32, 1_u8), (3, 60, 4, 50, 1), (6, 100, 6, 50, 2),
                (8, 100, 6, 50, 2), (9, 120, 8, 50, 2), (11, 140, 10, 100, 3),
                (13, 140, 10, 100, 3), (14, 160, 12, 100, 3), (16, 180, 14, 100, 4),
                (18, 180, 14, 100, 4), (19, 200, 16, 100, 4), (21, 220, 18, 150, 5),
                (23, 220, 18, 150, 5), (24, 240, 20, 150, 5), (26, 260, 22, 150, 6),
                (27, 260, 22, 150, 6), (29, 280, 24, 150, 6), (31, 300, 26, 200, 7),
                (32, 300, 26, 200, 7), (34, 320, 28, 200, 7), (37, 350, 35, 200, 8),
                (39, 400, 50, 200, 8),
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
                    mortgaged: false,
                };

                world.write_model(@property);
                i += 1;
            };
        }

        fn owns_monopoly(
            self: @ContractState, game_id: felt252, player: ContractAddress, color_group: u8,
        ) -> bool {
            let mut world = self.world_default();

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

        fn get_move_count(self: @ContractState, game_id: felt252) -> u32 {
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

        fn count_active_players(self: @ContractState, game_id: felt252) -> u8 {
            let mut world = self.world_default();
            let game: Game = world.read_model(game_id);
            let mut count: u8 = 0;
            let mut i: u8 = 0;

            while i < game.player_count {
                let player_addr = self.get_player_address_by_id(game_id, i);
                let player: Player = world.read_model((game_id, player_addr));
                if !player.bankrupt {
                    count += 1;
                }
                i += 1;
            }

            count
        }

        fn get_last_active_player(self: @ContractState, game_id: felt252) -> ContractAddress {
            let mut world = self.world_default();
            let game: Game = world.read_model(game_id);
            let mut i: u8 = 0;

            while i < game.player_count {
                let player_addr = self.get_player_address_by_id(game_id, i);
                let player: Player = world.read_model((game_id, player_addr));
                if !player.bankrupt {
                    return player_addr;
                }
                i += 1;
            }

            Zero::zero()
        }

        fn get_player_address_by_id(
            self: @ContractState, game_id: felt252, player_id: u8,
        ) -> ContractAddress {
            // This would need to be implemented based on your storage structure
            // For now, returning zero address as placeholder
            Zero::zero()
        }
    }
}

fn calculate_rent(base_rent: u32, houses: u8) -> u32 {
    let multipliers = array![1_u32, 5, 15, 45, 80, 125];
    let multiplier = *multipliers.at(houses.into());
    base_rent * multiplier
}
