const ChainList = artifacts.require("ChainList");

// test suite
contract("ChainList", accounts => {
    let chainListInstance;
    const seller = accounts[1];
    const buyer = accounts[2];
    const articleId = 1;
    const articleName = "article 1";
    const articleDescription = "Description for article 1";
    const articlePrice = 10;

    before("setup contract for each test", async () => {
        chainListInstance = await ChainList.deployed();
    });

    // no article for sale yet
    it("should throw an exception if you try to buy an article when there is no article for sale yet", async () => {
        try {
            await chainListInstance
                .buyArticle(articleId, {
                    from: buyer,
                    value: web3.utils.toWei(parseFloat(articlePrice).toString(), "ether")
                });

            // we should never reach this step
            assert.fail();
        } catch (error) {
            assert.equal(error.reason, "No article to buy");
        }

        const nbArticles = await chainListInstance.getNumberOfArticles();
        assert.equal(nbArticles, 0, "number of articles must be 0");
    });

    // Test case: buying an article that does not exist
    it("should throw an exception if you try to buy an article that does not exist", async () => {
        await chainListInstance.sellArticle(articleName, articleDescription, web3.utils.toWei(parseFloat(articlePrice).toString(), "ether"), {from: seller});
        try {
            await chainListInstance.buyArticle(2, {
                from: seller,
                value: web3.utils.toWei(parseFloat(articlePrice).toString(), "ether")
            });
            assert.fail();
        } catch(error) {
            assert.equal(error.reason, "Article doesn't exist");
        }    

        const article = await chainListInstance.articles(articleId);
        assert.equal(article.id, articleId, "article id must be " + articleId);
        assert.equal(article.seller, seller, "seller must be " + seller);
        assert.equal(article.buyer, 0x0, "buyer must be empty");
        assert.equal(article.name, articleName, "article name must be " + articleName);
        assert.equal(article.description, articleDescription, "article description must be " + articleDescription);
        assert.equal(
            article.price.toString(), 
            web3.utils.toWei(parseFloat(articlePrice).toString(), "ether"), 
            "article price must be " + web3.utils.toWei(parseFloat(articlePrice).toString(), "ether")
        );
    });

    // Test case: buying an article you are selling
    it("should throw an exception if you try to buy your own article", async () => {
        try {
            await chainListInstance.buyArticle(articleId, {
                from: seller,
                value: web3.utils.toWei(parseFloat(articlePrice).toString(), "ether")
            });
            assert.fail();
        } catch(error) {
            assert.equal(error.reason, "Buyer cannot be the seller");
        }
         
        const article = await chainListInstance.articles(articleId);
        assert.equal(article.id, articleId, "article id must be " + articleId);
        assert.equal(article.seller, seller, "seller must be " + seller);
        assert.equal(article.buyer, 0x0, "buyer must be empty");
        assert.equal(article.name, articleName, "article name must be " + articleName);
        assert.equal(article.description, articleDescription, "article description must be " + articleDescription);
        assert.equal(
            article.price.toString(), 
            web3.utils.toWei(parseFloat(articlePrice).toString(), "ether"), 
            "article price must be " + web3.utils.toWei(parseFloat(articlePrice).toString(), "ether")
        );
    });

    // Test case: incorrect value
    it("should throw an exception if you try to buy an article for a value different from its price", async () => {
        try {
            await chainListInstance.buyArticle(articleId, {
                from: buyer,
                value: web3.utils.toWei(parseFloat(articlePrice + 1).toString(), "ether")
            });
            assert.fail();
        } catch(error) {
            assert.equal(error.reason,  "Price doesn't match");
        }    
        
        const article = await chainListInstance.articles(articleId);
        assert.equal(article.id, articleId, "article id must be " + articleId);
        assert.equal(article.seller, seller, "seller must be " + seller);
        assert.equal(article.buyer, 0x0, "buyer must be empty");
        assert.equal(article.name, articleName, "article name must be " + articleName);
        assert.equal(article.description, articleDescription, "article description must be " + articleDescription);
        assert.equal(
            article.price.toString(), 
            web3.utils.toWei(parseFloat(articlePrice).toString(), "ether"), 
            "article price must be " + web3.utils.toWei(parseFloat(articlePrice).toString(), "ether")
        );
    });

    // Test case: article has already been sold
    it("should throw an exception if you try to buy an article that has already been sold", async () => {
        await chainListInstance.buyArticle(articleId, {
            from: buyer,
            value: web3.utils.toWei(parseFloat(articlePrice).toString(), "ether")
        });
        try{
            await chainListInstance.buyArticle(articleId, {
                from: accounts[0],
                value: web3.utils.toWei(parseFloat(articlePrice).toString(), "ether")
            });
            assert.fail();
        }catch(error) {
            assert.equal(error.reason, "Article already sold");
        }

        const article = await chainListInstance.articles(articleId);
        assert.equal(article.id, articleId, "article id must be " + articleId);
        assert.equal(article.seller, seller, "seller must be " + seller);
        assert.equal(article.buyer, buyer, "buyer must be " + buyer);
        assert.equal(article.name, articleName, "article name must be " + articleName);
        assert.equal(article.description, articleDescription, "article description must be " + articleDescription);
        assert.equal(
            article.price.toString(), 
            web3.utils.toWei(parseFloat(articlePrice).toString(), "ether"), 
            "article price must be " + web3.utils.toWei(parseFloat(articlePrice).toString(), "ether")
        );
    });
});