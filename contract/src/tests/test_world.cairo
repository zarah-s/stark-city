#[cfg(test)]
mod tests {
    use dojo::model::{ModelStorage, ModelStorageTest};
    use dojo::world::{WorldStorageTrait, world};
    use dojo_cairo_test::{
        ContractDef, ContractDefTrait, NamespaceDef, TestResource, WorldStorageTestTrait,
        spawn_test_world,
    };
    use starkcity::models::{
        Game, GameMove, Player, Property, m_Game, m_GameMove, m_Player, m_Property,
    };
    use starkcity::systems::actions::{IActionsDispatcher, IActionsDispatcherTrait, actions};
    use starkcity::tokens::erc1155::{IERC1155Dispatcher, IERC1155DispatcherTrait, PropertyNFT};
    use starknet::ContractAddress;
    use starknet::syscalls::deploy_syscall;
    use starknet::testing::set_contract_address;

    fn namespace_def() -> NamespaceDef {
        let ndef = NamespaceDef {
            namespace: "starkcity",
            resources: [
                TestResource::Model(m_Game::TEST_CLASS_HASH),
                TestResource::Model(m_Player::TEST_CLASS_HASH),
                TestResource::Model(m_Property::TEST_CLASS_HASH),
                TestResource::Model(m_GameMove::TEST_CLASS_HASH),
                TestResource::Event(actions::e_GameCreated::TEST_CLASS_HASH),
                TestResource::Event(actions::e_DiceRolled::TEST_CLASS_HASH),
                TestResource::Event(actions::e_GameStarted::TEST_CLASS_HASH),
                TestResource::Event(actions::e_HouseBought::TEST_CLASS_HASH),
                TestResource::Event(actions::e_HouseSold::TEST_CLASS_HASH),
                TestResource::Event(actions::e_PlayerJoined::TEST_CLASS_HASH),
                TestResource::Event(actions::e_PropertyPurchased::TEST_CLASS_HASH),
                TestResource::Event(actions::e_RentPaid::TEST_CLASS_HASH),
                TestResource::Event(actions::e_TurnChanged::TEST_CLASS_HASH),
                TestResource::Contract(actions::TEST_CLASS_HASH),
            ]
                .span(),
        };

        ndef
    }

    fn contract_defs() -> Span<ContractDef> {
        [
            ContractDefTrait::new(@"starkcity", @"actions")
                .with_writer_of([dojo::utils::bytearray_hash(@"starkcity")].span())
        ]
            .span()
    }

    // Helper function to setup test world with NFT contract
    fn setup_world() -> (
        dojo::world::WorldStorage, crate::systems::actions::IActionsDispatcher, IERC1155Dispatcher,
    ) {
        let ndef = namespace_def();

        // Register the resources.
        let mut world = spawn_test_world(world::TEST_CLASS_HASH, [ndef].span());

        // Ensures permissions and initializations are synced.
        world.sync_perms_and_inits(contract_defs());

        let (contract_address, _) = world.dns(@"actions").unwrap();
        let actions = IActionsDispatcher { contract_address };

        // Deploy NFT contract
        let mut calldata = ArrayTrait::new();
        calldata.append(contract_address.into()); // game_contract address

        let (nft_address, _) = deploy_syscall(
            PropertyNFT::TEST_CLASS_HASH.try_into().unwrap(), 0, calldata.span(), false,
        )
            .unwrap();

        let nft = IERC1155Dispatcher { contract_address: nft_address };

        // Set NFT contract in actions
        actions.set_nft_contract(nft_address);

        (world, actions, nft)
    }

    // Helper to create test addresses
    fn PLAYER1() -> ContractAddress {
        0x1.try_into().unwrap()
    }

    fn PLAYER2() -> ContractAddress {
        0x2.try_into().unwrap()
    }

    fn PLAYER3() -> ContractAddress {
        0x3.try_into().unwrap()
    }

    #[test]
    #[available_gas(30000000000000000)]
    fn test_create_game() {
        let (world, actions, _nft) = setup_world();

        // Set caller as player 1
        set_contract_address(PLAYER1());

        let game_id = 12345;

        // Create game
        actions.create_game(game_id);

        // Verify game was created
        let game: Game = world.read_model(game_id);
        assert(game.game_id == game_id, 'Wrong game ID');
        assert(game.host == PLAYER1(), 'Wrong host');
        assert(!game.started, 'Game should not be started');
        assert(game.player_count == 0, 'Should have 0 players');
        assert(game.current_player == 0, 'Current player should be 0');
    }

    #[test]
    #[available_gas(30000000000000000)]
    fn test_join_game() {
        let (world, actions, _nft) = setup_world();

        // Player 1 creates game
        set_contract_address(PLAYER1());
        let game_id = 12345;
        actions.create_game(game_id);

        // Player 1 joins
        let piece1 = 0_u8; // 🚗
        actions.join_game(game_id, piece1);

        // Verify player 1 joined
        let player1: Player = world.read_model((game_id, PLAYER1()));
        assert(player1.player_id == 0, 'Wrong player ID');
        assert(player1.money == 1500, 'Wrong starting money');
        assert(player1.position == 0, 'Wrong starting position');
        assert(player1.piece == piece1, 'Wrong piece');
        assert(player1.is_active, 'Player should be active');

        // Verify game updated
        let game: Game = world.read_model(game_id);
        assert(game.player_count == 1, 'Should have 1 player');

        // Player 2 joins
        set_contract_address(PLAYER2());
        let piece2 = 1_u8; // 🎩
        actions.join_game(game_id, piece2);

        let player2: Player = world.read_model((game_id, PLAYER2()));
        assert(player2.player_id == 1, 'Wrong player 2 ID');
        assert(player2.money == 1500, 'Wrong starting money');

        let game: Game = world.read_model(game_id);
        assert(game.player_count == 2, 'Should have 2 players');
    }


    #[test]
    #[available_gas(30000000000000000)]
    #[should_panic]
    fn test_cannot_join_started_game() {
        let (_world, actions, _) = setup_world();

        set_contract_address(PLAYER1());
        let game_id = 12345;
        actions.create_game(game_id);
        actions.join_game(game_id, 0);

        set_contract_address(PLAYER2());
        actions.join_game(game_id, 1);

        // Start game
        set_contract_address(PLAYER1());
        actions.start_game(game_id);

        // Try to join after game started (should fail)
        set_contract_address(PLAYER3());
        actions.join_game(game_id, 2);
    }

    #[test]
    #[available_gas(30000000000000000)]
    #[should_panic]
    fn test_cannot_join_full_game() {
        let (_world, actions, _) = setup_world();

        set_contract_address(PLAYER1());
        let game_id = 12345;
        actions.create_game(game_id);

        // Add 4 players
        set_contract_address(PLAYER1());
        actions.join_game(game_id, 0);

        set_contract_address(PLAYER2());
        actions.join_game(game_id, 1);

        set_contract_address(PLAYER3());
        actions.join_game(game_id, 2);

        set_contract_address(0x4.try_into().unwrap());
        actions.join_game(game_id, 3);

        // Try to add 5th player (should fail)
        set_contract_address(0x5.try_into().unwrap());
        actions.join_game(game_id, 4);
    }


    #[test]
    #[available_gas(30000000000000000)]
    #[should_panic]
    fn test_only_host_can_start() {
        let (_world, actions, _) = setup_world();

        set_contract_address(PLAYER1());
        let game_id = 12345;
        actions.create_game(game_id);
        actions.join_game(game_id, 0);

        set_contract_address(PLAYER2());
        actions.join_game(game_id, 1);

        // Player 2 tries to start (should fail)
        actions.start_game(game_id);
    }

    #[test]
    #[should_panic]
    fn test_cannot_start_with_one_player() {
        let (_world, actions, _) = setup_world();

        set_contract_address(PLAYER1());
        let game_id = 12345;
        actions.create_game(game_id);
        actions.join_game(game_id, 0);

        // Try to start with only 1 player (should fail)
        actions.start_game(game_id);
    }

    #[test]
    #[should_panic]
    fn test_cannot_buy_owned_property() {
        let (mut world, actions, _) = setup_world();

        set_contract_address(PLAYER1());
        let game_id = 12345;
        actions.create_game(game_id);
        actions.join_game(game_id, 0);

        set_contract_address(PLAYER2());
        actions.join_game(game_id, 1);

        set_contract_address(PLAYER1());
        actions.start_game(game_id);

        // Player 1 buys property
        let mut player1: Player = world.read_model((game_id, PLAYER1()));
        player1.position = 1;
        world.write_model_test(@player1);
        actions.buy_property(game_id, 1);

        // Player 2 tries to buy same property (should fail)
        set_contract_address(PLAYER2());
        let mut player2: Player = world.read_model((game_id, PLAYER2()));
        player2.position = 1;
        world.write_model_test(@player2);
        actions.buy_property(game_id, 1);
    }


    #[test]
    #[available_gas(30000000000000000)]
    fn test_buy_property_mints_nft() {
        let (mut world, actions, nft) = setup_world();

        // Setup game
        set_contract_address(PLAYER1());
        let game_id = 12345;
        actions.create_game(game_id);
        actions.join_game(game_id, 0);

        set_contract_address(PLAYER2());
        actions.join_game(game_id, 1);

        set_contract_address(PLAYER1());
        actions.start_game(game_id);

        // Move player to property position 1 (Mediterranean Avenue, $60)
        let mut player1: Player = world.read_model((game_id, PLAYER1()));
        player1.position = 1;
        world.write_model_test(@player1);

        // Check NFT balance before purchase
        let balance_before = nft.balance_of(PLAYER1(), 1);
        assert(balance_before == 0, 'Should have 0 NFTs');

        // Buy property
        actions.buy_property(game_id, 1);

        // Verify purchase
        let player1: Player = world.read_model((game_id, PLAYER1()));
        assert(player1.money == 1440, 'Wrong money after purchase');

        let property: Property = world.read_model((game_id, 1));
        assert(property.owner == PLAYER1(), 'Wrong property owner');

        // Verify NFT was minted
        let balance_after = nft.balance_of(PLAYER1(), 1);
        assert(balance_after == 1, 'Should have 1 property NFT');
    }

    #[test]
    fn test_buy_house_mints_nft() {
        let (mut world, actions, nft) = setup_world();

        // Setup game
        set_contract_address(PLAYER1());
        let game_id = 12345;
        actions.create_game(game_id);
        actions.join_game(game_id, 0);

        set_contract_address(PLAYER2());
        actions.join_game(game_id, 1);

        set_contract_address(PLAYER1());
        actions.start_game(game_id);

        // Buy both purple properties (positions 1 and 3) to get monopoly
        let mut player1: Player = world.read_model((game_id, PLAYER1()));
        player1.position = 1;
        world.write_model_test(@player1);
        actions.buy_property(game_id, 1);

        player1 = world.read_model((game_id, PLAYER1()));
        player1.position = 3;
        world.write_model_test(@player1);
        actions.buy_property(game_id, 3);

        // Check house NFT balance before
        let house_token_id: u256 = 1001; // 1000 + position 1
        let balance_before = nft.balance_of(PLAYER1(), house_token_id);
        assert(balance_before == 0, 'Should have 0 house NFTs');

        // Now buy house on position 1
        actions.buy_house(game_id, 1);

        let property: Property = world.read_model((game_id, 1));
        assert(property.houses == 1, 'Should have 1 house');

        // Verify house NFT was minted
        let balance_after = nft.balance_of(PLAYER1(), house_token_id);
        assert(balance_after == 1, 'Should have 1 house NFT');
    }

    #[test]
    fn test_buy_hotel_swaps_nfts() {
        let (mut world, actions, nft) = setup_world();

        set_contract_address(PLAYER1());
        let game_id = 12345;
        actions.create_game(game_id);
        actions.join_game(game_id, 0);

        set_contract_address(PLAYER2());
        actions.join_game(game_id, 1);

        set_contract_address(PLAYER1());
        actions.start_game(game_id);

        // Setup monopoly and give extra money
        let mut player1: Player = world.read_model((game_id, PLAYER1()));
        player1.position = 1;
        player1.money = 10000;
        world.write_model_test(@player1);
        actions.buy_property(game_id, 1);

        player1 = world.read_model((game_id, PLAYER1()));
        player1.position = 3;
        world.write_model_test(@player1);
        actions.buy_property(game_id, 3);

        // Buy 4 houses
        actions.buy_house(game_id, 1);
        actions.buy_house(game_id, 1);
        actions.buy_house(game_id, 1);
        actions.buy_house(game_id, 1);

        let house_token_id: u256 = 1001;
        let hotel_token_id: u256 = 2001;

        // Should have 4 houses
        let houses_before = nft.balance_of(PLAYER1(), house_token_id);
        assert(houses_before == 4, 'Should have 4 house NFTs');

        // Buy 5th house (hotel)
        actions.buy_house(game_id, 1);

        // Should have 0 houses and 1 hotel
        let houses_after = nft.balance_of(PLAYER1(), house_token_id);
        let hotels_after = nft.balance_of(PLAYER1(), hotel_token_id);
        assert(houses_after == 0, 'Should have 0 house NFTs');
        assert(hotels_after == 1, 'Should have 1 hotel NFT');
    }

    #[test]
    fn test_sell_house_burns_nft() {
        let (mut world, actions, nft) = setup_world();

        set_contract_address(PLAYER1());
        let game_id = 12345;
        actions.create_game(game_id);
        actions.join_game(game_id, 0);

        set_contract_address(PLAYER2());
        actions.join_game(game_id, 1);

        set_contract_address(PLAYER1());
        actions.start_game(game_id);

        // Buy monopoly and house
        let mut player1: Player = world.read_model((game_id, PLAYER1()));
        player1.position = 1;
        world.write_model_test(@player1);
        actions.buy_property(game_id, 1);

        player1 = world.read_model((game_id, PLAYER1()));
        player1.position = 3;
        world.write_model_test(@player1);
        actions.buy_property(game_id, 3);

        actions.buy_house(game_id, 1);

        let house_token_id: u256 = 1001;
        let balance_before = nft.balance_of(PLAYER1(), house_token_id);
        assert(balance_before == 1, 'Should have 1 house NFT');

        // Sell house
        actions.sell_house(game_id, 1);

        // Verify house NFT was burned
        let balance_after = nft.balance_of(PLAYER1(), house_token_id);
        assert(balance_after == 0, 'Should have 0 house NFTs');
    }

    #[test]
    fn test_sell_hotel_swaps_nfts() {
        let (mut world, actions, nft) = setup_world();

        set_contract_address(PLAYER1());
        let game_id = 12345;
        actions.create_game(game_id);
        actions.join_game(game_id, 0);

        set_contract_address(PLAYER2());
        actions.join_game(game_id, 1);

        set_contract_address(PLAYER1());
        actions.start_game(game_id);

        // Build to hotel
        let mut player1: Player = world.read_model((game_id, PLAYER1()));
        player1.position = 1;
        player1.money = 10000;
        world.write_model_test(@player1);
        actions.buy_property(game_id, 1);

        player1 = world.read_model((game_id, PLAYER1()));
        player1.position = 3;
        world.write_model_test(@player1);
        actions.buy_property(game_id, 3);

        // Build 5 houses (hotel)
        actions.buy_house(game_id, 1);
        actions.buy_house(game_id, 1);
        actions.buy_house(game_id, 1);
        actions.buy_house(game_id, 1);
        actions.buy_house(game_id, 1);

        let house_token_id: u256 = 1001;
        let hotel_token_id: u256 = 2001;

        // Verify hotel NFT
        let hotels_before = nft.balance_of(PLAYER1(), hotel_token_id);
        assert(hotels_before == 1, 'Should have 1 hotel NFT');

        // Sell hotel
        actions.sell_house(game_id, 1);

        // Should have 0 hotels and 4 houses
        let hotels_after = nft.balance_of(PLAYER1(), hotel_token_id);
        let houses_after = nft.balance_of(PLAYER1(), house_token_id);
        assert(hotels_after == 0, 'Should have 0 hotel NFTs');
        assert(houses_after == 4, 'Should have 4 house NFTs');
    }


    #[test]
    #[available_gas(30000000000000000)]
    fn test_start_game() {
        let (world, actions, _nft) = setup_world();

        set_contract_address(PLAYER1());
        let game_id = 12345;
        actions.create_game(game_id);
        actions.join_game(game_id, 0);

        set_contract_address(PLAYER2());
        actions.join_game(game_id, 1);

        set_contract_address(PLAYER1());
        actions.start_game(game_id);

        let game: Game = world.read_model(game_id);
        assert(game.started, 'Game should be started');
        assert(game.current_player == 0, 'Current player should be 0');
    }

    #[test]
    #[available_gas(30000000000000000)]
    fn test_roll_dice() {
        let (world, actions, _nft) = setup_world();

        set_contract_address(PLAYER1());
        let game_id = 12345;
        actions.create_game(game_id);
        actions.join_game(game_id, 0);

        set_contract_address(PLAYER2());
        actions.join_game(game_id, 1);

        set_contract_address(PLAYER1());
        actions.start_game(game_id);

        let dice1 = 3_u8;
        let dice2 = 4_u8;
        actions.roll_dice(game_id, dice1, dice2);

        let player1: Player = world.read_model((game_id, PLAYER1()));
        assert(player1.position == 7, 'Wrong position after roll');

        let game_move: GameMove = world.read_model((game_id, 0));
        assert(game_move.player == PLAYER1(), 'Wrong player in move');
        assert(game_move.dice1 == dice1, 'Wrong dice1');
        assert(game_move.dice2 == dice2, 'Wrong dice2');
        assert(game_move.new_position == 7, 'Wrong new position');
    }

    #[test]
    #[available_gas(30000000000000000)]
    fn test_next_turn() {
        let (world, actions, _nft) = setup_world();

        set_contract_address(PLAYER1());
        let game_id = 12345;
        actions.create_game(game_id);
        actions.join_game(game_id, 0);

        set_contract_address(PLAYER2());
        actions.join_game(game_id, 1);

        set_contract_address(PLAYER1());
        actions.start_game(game_id);

        let game: Game = world.read_model(game_id);
        assert(game.current_player == 0, 'Should be player 0 turn');

        actions.next_turn(game_id);

        let game: Game = world.read_model(game_id);
        assert(game.current_player == 1, 'Should be player 1 turn');

        actions.next_turn(game_id);

        let game: Game = world.read_model(game_id);
        assert(game.current_player == 0, 'Should wrap to player 0');
    }

    #[test]
    #[available_gas(30000000000000000)]
    fn test_pass_go_collect_200() {
        let (mut world, actions, _) = setup_world();
        // world.sync_perms_and_inits(contract_defs());
        // Setup game
        set_contract_address(PLAYER1());
        let game_id = 12345;
        actions.create_game(game_id);
        actions.join_game(game_id, 0);

        set_contract_address(PLAYER2());
        actions.join_game(game_id, 1);

        set_contract_address(PLAYER1());
        actions.start_game(game_id);

        // Manually set player position to 38
        let mut player1: Player = world.read_model((game_id, PLAYER1()));
        player1.position = 38;
        world.write_model_test(@player1);

        // Roll dice to pass GO
        actions.roll_dice(game_id, 3, 2);

        let player1: Player = world.read_model((game_id, PLAYER1()));
        assert(player1.position == 3, 'Wrong position');
        assert(player1.money == 1700, 'Should have +200 for GO');
    }

    #[test]
    #[available_gas(30000000000000000)]
    #[should_panic]
    fn test_cannot_roll_out_of_turn() {
        let (_world, actions, _) = setup_world();

        set_contract_address(PLAYER1());
        let game_id = 12345;
        actions.create_game(game_id);
        actions.join_game(game_id, 0);

        set_contract_address(PLAYER2());
        actions.join_game(game_id, 1);

        set_contract_address(PLAYER1());
        actions.start_game(game_id);

        // Player 2 tries to roll (should fail, it's player 1's turn)
        set_contract_address(PLAYER2());
        actions.roll_dice(game_id, 3, 4);
    }

    #[test]
    #[should_panic]
    fn test_cannot_buy_property_not_on() {
        let (_world, actions, _) = setup_world();

        set_contract_address(PLAYER1());
        let game_id = 12345;
        actions.create_game(game_id);
        actions.join_game(game_id, 0);

        set_contract_address(PLAYER2());
        actions.join_game(game_id, 1);

        set_contract_address(PLAYER1());
        actions.start_game(game_id);

        // Player is at position 0, try to buy position 1 (should fail)
        actions.buy_property(game_id, 1);
    }

    #[test]
    #[should_panic]
    fn test_cannot_buy_house_without_monopoly() {
        let (mut world, actions, _) = setup_world();

        set_contract_address(PLAYER1());
        let game_id = 12345;
        actions.create_game(game_id);
        actions.join_game(game_id, 0);

        set_contract_address(PLAYER2());
        actions.join_game(game_id, 1);

        set_contract_address(PLAYER1());
        actions.start_game(game_id);

        // Buy only one purple property
        let mut player1: Player = world.read_model((game_id, PLAYER1()));
        player1.position = 1;
        world.write_model_test(@player1);
        actions.buy_property(game_id, 1);

        // Try to buy house (should fail - don't own monopoly)
        actions.buy_house(game_id, 1);
    }

    #[test]
    #[should_panic]
    fn test_cannot_buy_more_than_hotel() {
        let (mut world, actions, _) = setup_world();

        set_contract_address(PLAYER1());
        let game_id = 12345;
        actions.create_game(game_id);
        actions.join_game(game_id, 0);

        set_contract_address(PLAYER2());
        actions.join_game(game_id, 1);

        set_contract_address(PLAYER1());
        actions.start_game(game_id);

        // Setup monopoly and build to hotel
        let mut player1: Player = world.read_model((game_id, PLAYER1()));
        player1.position = 1;
        player1.money = 10000; // Give enough money
        world.write_model_test(@player1);
        actions.buy_property(game_id, 1);

        player1 = world.read_model((game_id, PLAYER1()));
        player1.position = 3;
        world.write_model_test(@player1);
        actions.buy_property(game_id, 3);

        // Buy 5 houses (hotel)
        actions.buy_house(game_id, 1);
        actions.buy_house(game_id, 1);
        actions.buy_house(game_id, 1);
        actions.buy_house(game_id, 1);
        actions.buy_house(game_id, 1);

        // Try to buy 6th (should fail)
        actions.buy_house(game_id, 1);
    }
}
