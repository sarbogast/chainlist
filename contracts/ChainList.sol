pragma solidity >0.4.99 <0.6.0;
import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';

contract ChainList is Ownable {
  
  // Custom types
  struct Article {
    uint id;
    address payable seller;
    address buyer;
    string name;
    string description;
    uint256 price;
  }

  // State variables
  mapping (uint => Article) public articles;
  uint articleCounter;

  // Events
  event LogSellArticle (
    uint indexed _id,
    address indexed _seller,
    string _name,
    uint256 _price
  );
  event LogBuyArticle (
    uint indexed _id,
    address indexed _seller,
    address indexed _buyer,
    string _name,
    uint256 _price
  );

  // kill the smart contract
  function kill() public onlyOwner {    
    selfdestruct(msg.sender);
  }

  // sell an article
  function sellArticle(string memory _name, string memory _description, uint256 _price) public {
    // a name is required
    bytes memory name = bytes(_name);
    require(name.length > 0, "name is required");

    // a description is required
    bytes memory description = bytes(_description);
    require(description.length > 0, "description is required");

    // the price can be 0 if seller decides to give the article for free

    // a new article
    articleCounter++;

    // store this article
    articles[articleCounter] = Article(
      articleCounter,
      msg.sender,
      address(0),
      _name,
      _description,
      _price);

    emit LogSellArticle(articleCounter, msg.sender, _name, _price);
  }

  // fetch the number of articles in the contract
  function getNumberOfArticles() public view returns (uint) {
    return articleCounter;
  }

  // fetch and return all article IDs for articles still for sale
  function getArticlesForSale() public view returns (uint[] memory) {
    // prepare output array
    uint[] memory articleIds = new uint[](articleCounter);

    uint numberOfArticlesForSale = 0;
    // iterate over articles
    for (uint i = 1; i <= articleCounter; i++) {
      // keep the ID if the article is still for sale
      if (articles[i].buyer == address(0)) {
        articleIds[numberOfArticlesForSale] = articles[i].id;
        numberOfArticlesForSale++;
      }
    }

    // copy the articleIds array into a smaller forSale array
    uint[] memory forSale = new uint[](numberOfArticlesForSale);
    for (uint i = 0; i < numberOfArticlesForSale; i++) {
      forSale[i] = articleIds[i];
    }
    return forSale;
  }

  // buy an article
  function buyArticle(uint _id) payable public {
    // we check whether there is an article for sale
    require(articleCounter > 0, "No article to buy");

    // we check that the article exists
    require(_id > 0 && _id <= articleCounter, "Article doesn't exist");

    // we retrieve the article
    Article storage article = articles[_id];

    // we check that the article has not been sold yet
    require(article.buyer == address(0), "Article already sold");

    // we don't allow the seller to buy his own article
    require(msg.sender != article.seller, "Buyer cannot be the seller");

    // we check that the value sent corresponds to the price of the article
    require(msg.value == article.price, "Price doesn't match");

    // keep buyer's information
    article.buyer = msg.sender;

    // the buyer can pay the seller
    article.seller.transfer(msg.value);

    // trigger the event
    emit LogBuyArticle(_id, article.seller, article.buyer, article.name, article.price);
  }
}