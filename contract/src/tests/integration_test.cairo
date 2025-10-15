#[cfg(test)]
mod integration_tests {
    use dojo::model::ModelStorage;
    use dojo::world::{WorldStorageTrait, world};
    use dojo_cairo_test::{
        ContractDef, ContractDefTrait, NamespaceDef, TestResource, WorldStorageTestTrait,
        spawn_test_world,
    };
    use starkcity::models::{Game, m_Game, m_GameMove, m_Player, m_Property};
    use starkcity::systems::actions::{IActionsDispatcher, IActionsDispatcherTrait, actions};
    use starknet::ContractAddress;
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

    // Helper function to setup test world
    fn setup_world() -> (dojo::world::WorldStorage, crate::systems::actions::IActionsDispatcher) {
        let ndef = namespace_def();

        // Register the resources.
        let mut world = spawn_test_world(world::TEST_CLASS_HASH, [ndef].span());

        // Ensures permissions and initializations are synced.
        world.sync_perms_and_inits(contract_defs());

        let (contract_address, _) = world.dns(@"actions").unwrap();
        let actions = IActionsDispatcher { contract_address };

        (world, actions)
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
    fn test_full_game_flow() {
        let (world, actions) = setup_world();

        // Create game
        set_contract_address(PLAYER1());
        let game_id = 99999;
        actions.create_game(game_id);

        // Join players
        actions.join_game(game_id, 0);
        set_contract_address(PLAYER2());
        actions.join_game(game_id, 1);
        set_contract_address(PLAYER3());
        actions.join_game(game_id, 2);

        // Start game
        set_contract_address(PLAYER1());
        actions.start_game(game_id);

        // Play some turns
        actions.roll_dice(game_id, 2, 3);
        actions.next_turn(game_id);

        set_contract_address(PLAYER2());
        actions.roll_dice(game_id, 4, 4);
        actions.next_turn(game_id);

        set_contract_address(PLAYER3());
        actions.roll_dice(game_id, 1, 2);
        actions.next_turn(game_id);

        // Verify game state
        let game: Game = world.read_model(game_id);
        assert(game.started, 'Game should be active');
        assert(game.player_count == 3, 'Should have 3 players');
    }
}

