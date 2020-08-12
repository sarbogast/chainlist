pragma solidity >0.4.99 <0.6.0;

contract Ownable {
  // state variables
  address payable owner;

  // modifiers
  modifier onlyOwner() {
    // only allowed to the contract's owner
    require(msg.sender == owner, "Only allowed to the contract's owner");
    _;
  }
  
  // constructor
  constructor() public {
    owner = msg.sender;
  }
}