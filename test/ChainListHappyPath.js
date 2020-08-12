const ChainList = artifacts.require("ChainList");

// test suite
contract("ChainList", accounts => {
    let chainListInstance;
    const seller = accounts[1];
    const buyer = accounts[2];
    const articleName1 = "article 1";
    const articleDescription1 = "Description for article 1";
    const articlePrice1 = 3;
    const articleName2 = "article 2";
    const articleDescription2 = "Description for article 2";
    const articlePrice2 = 6;
    let sellerBalanceBeforeSale, sellerBalanceAfterSale;
    let buyerBalanceBeforeSale, buyerBalanceAfterSale;
 
    before('setup contract for each test', async () => {
        chainListInstance = await ChainList.deployed();
    })
    
    it("should be initialized with empty values", async () => {
        const nbArticles = await chainListInstance.getNumberOfArticles();
        assert.equal(nbArticles, 0, "number of articles must be zero");

        const articlesForSale = await chainListInstance.getArticlesForSale();
        assert.equal(articlesForSale.length, 0, "there shouldn't be any article for sale");
    });

    // sell a first article
    it("should let us sell a first article", async () => {
        const receipt = await chainListInstance
            .sellArticle(
                articleName1,
                articleDescription1,
                web3.utils.toWei(parseFloat(articlePrice1).toString(), "ether"), {
                from: seller
            });

        assert.equal(receipt.logs.length, 1, "one event should have been triggered");
        const event = receipt.logs[0];
        assert.equal(event.event, "LogSellArticle", "event should be LogSellArticle");
        assert.equal(event.args._seller, seller, "seller must be " + seller);
        assert.equal(event.args._name, articleName1, "article name must be " + articleName1);
        assert.equal(
            web3.utils.toBN(event.args._price),
            web3.utils.toWei(parseFloat(articlePrice1).toString(), "ether"),
            "event article price must be " + web3.utils.toWei(parseFloat(articlePrice1).toString(), "ether")
        );

        const nbArticles = await chainListInstance.getNumberOfArticles();
        assert.equal(nbArticles, 1, "number of articles must be 1");

        const articlesForSale = await chainListInstance.getArticlesForSale();
        assert.equal(articlesForSale.length, 1, "there must be one article for sale");

        const article = await chainListInstance.articles(articlesForSale[0]);
        assert.equal(web3.utils.toBN(article.id), 1, "article id must be 1");
        assert.equal(article.seller, seller, "seller must be " + seller);
        assert.equal(article.buyer, 0x0, "buyer must be empty");
        assert.equal(article.name, articleName1, "article name must be " + articleName1);
        assert.equal(article.description, articleDescription1, "article description must be " + articleDescription1);
        assert.equal(
            web3.utils.toBN(article.price), 
            web3.utils.toWei(parseFloat(articlePrice1).toString(), "ether"),
            "event article price must be " + web3.utils.toWei(parseFloat(articlePrice1).toString(), "ether")
        );
    });

    // sell a second article
    it("should let us sell a second article", async () => {
        const receipt = await chainListInstance
            .sellArticle(
                articleName2,
                articleDescription2,
                web3.utils.toWei(parseFloat(articlePrice2).toString(), "ether"), 
                {from: seller}
            );

        assert.equal(receipt.logs.length, 1, "one event should have been triggered");
        const event = receipt.logs[0];
        assert.equal(event.event, "LogSellArticle", "event should be LogSellArticle");
        assert.equal(event.args._seller, seller, "seller must be " + seller);
        assert.equal(event.args._name, articleName2, "article name must be " + articleName2);
        assert.equal(
            web3.utils.toBN(event.args._price),
            web3.utils.toWei(parseFloat(articlePrice2).toString(), "ether"),
            "event article price must be " + web3.utils.toWei(parseFloat(articlePrice2).toString(), "ether")
        );

        const nbArticles = await chainListInstance.getNumberOfArticles();
        assert.equal(nbArticles, 2, "number of articles must be 2");

        const articlesForSale = await chainListInstance.getArticlesForSale();
        assert.equal(articlesForSale.length, 2, "there must be two articles for sale");

        const article = await chainListInstance.articles(articlesForSale[1]);
        assert.equal(web3.utils.toBN(article.id), 2, "article id must be 2");
        assert.equal(article.seller, seller, "seller must be " + seller);
        assert.equal(article.buyer, 0x0, "buyer must be empty");
        assert.equal(article.name, articleName2, "article name must be " + articleName2);
        assert.equal(article.description, articleDescription2, "article description must be " + articleDescription2);
        assert.equal(
            web3.utils.toBN(article.price), 
            web3.utils.toWei(parseFloat(articlePrice2).toString(), "ether"),
            "event article price must be " + web3.utils.toWei(parseFloat(articlePrice2).toString(), "ether")
        );
    });

    // buy the first article
    it("should let us buy the first article", async () => {
        // record balances of seller and buyer before the sale
        let balance = await web3.eth.getBalance(seller);
        sellerBalanceBeforeSale = web3.utils.fromWei(balance, "ether");
        balance = await web3.eth.getBalance(buyer);
        buyerBalanceBeforeSale = web3.utils.fromWei(balance, "ether");

        // buy the article
        let receipt = await chainListInstance
            .buyArticle(1, {
                from: buyer,
                value: web3.utils.toWei(parseFloat(articlePrice1).toString(), "ether")
            });

        // test that the event emitted by the contract is alright
        assert.equal(receipt.logs.length, 1, "one event should have been triggered");
        const event = receipt.logs[0];
        assert.equal(event.event, "LogBuyArticle", "event should be LogBuyArticle");
        assert.equal(event.args._seller, seller, "seller must be " + seller);
        assert.equal(event.args._buyer, buyer, "buyer must be " + buyer);
        assert.equal(event.args._name, articleName1, "article name must be " + articleName1);
        assert.equal(
            web3.utils.toBN(event.args._price),
            web3.utils.toWei(parseFloat(articlePrice1).toString(), "ether"),
            "event article price must be " + web3.utils.toWei(parseFloat(articlePrice1).toString(), "ether")
        );

        // record balances of seller and buyer after the sale
        balance = await web3.eth.getBalance(seller);
        sellerBalanceAfterSale = web3.utils.fromWei(balance, "ether");
        balance = await web3.eth.getBalance(buyer);
        buyerBalanceAfterSale = web3.utils.fromWei(balance, "ether");
        // check the effect of buy on balances of buyer and seller, accounting for gas
        assert(parseFloat(sellerBalanceAfterSale) === (parseFloat(sellerBalanceBeforeSale) + parseFloat(articlePrice1)), "seller should have earned " + articlePrice1 + " ETH");
        assert(parseFloat(buyerBalanceAfterSale) <= (parseFloat(buyerBalanceBeforeSale) - parseFloat(articlePrice1)), "buyer should have spent " + articlePrice1 + " ETH");

        // check the effect on state
        const articlesForSale = await chainListInstance.getArticlesForSale();
        assert.equal(articlesForSale.length, 1, "there must be one article for sale");

        const nbArticles = await chainListInstance.getNumberOfArticles();
        assert.equal(nbArticles, 2, "number of articles must be 2");

        const article = await chainListInstance.articles(1);
        assert.equal(article.id, 1, "article id must be 1");
        assert.equal(article.seller, seller, "seller must be " + seller);
        assert.equal(article.buyer, buyer, "buyer must be " + buyer);
        assert.equal(article.name, articleName1, "article name must be " + articleName1);
        assert.equal(article.description, articleDescription1, "article description must be " + articleDescription1);
        assert.equal(
            web3.utils.toBN(article.price), 
            web3.utils.toWei(parseFloat(articlePrice1).toString(), "ether"),
            "article price must be " + web3.utils.toWei(parseFloat(articlePrice1).toString(), "ether")
        );
    });
});