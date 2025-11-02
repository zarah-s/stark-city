use starknet::ContractAddress;

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Game {
    #[key]
    pub game_id: felt252,
    pub host: ContractAddress,
    pub started: bool,
    pub current_player: u8,
    pub player_count: u8,
    pub winner: ContractAddress,
    pub turn_timeout: u8,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Player {
    #[key]
    pub game_id: felt252,
    #[key]
    pub player_address: ContractAddress,
    pub player_id: u8,
    pub position: u8,
    pub money: u32,
    pub piece: u8,
    pub is_active: bool,
    pub bankrupt: bool,
    pub in_jail: bool,
    pub jail_turns: u8,
    pub get_out_jail_free: u8,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Property {
    #[key]
    pub game_id: felt252,
    #[key]
    pub position: u8,
    pub owner: ContractAddress,
    pub houses: u8,
    pub price: u32,
    pub rent_base: u32,
    pub house_price: u32,
    pub color_group: u8,
    pub mortgaged: bool,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct GameMove {
    #[key]
    pub game_id: felt252,
    #[key]
    pub move_id: u32,
    pub player: ContractAddress,
    pub dice1: u8,
    pub dice2: u8,
    pub new_position: u8,
    pub timestamp: u64,
}
