App = {
    contracts: {},
    account: 0x0,
    logSellArticleEvent: null,
    logBuyArticleEvent: null,
    loading: false,

    init() {
        return App.initWeb3();
    },

    async initWeb3() {   
        if (window.ethereum) {
            // Modern dapp browsers with privacy mode on
            window.web3 = new Web3(ethereum);
            try {
                // Request account access if needed
                await ethereum.enable();

                App.displayAccountInfo();
                return App.initContract();      
            } catch (error) {
                // User denied account access...
                console.error("Unable to retrieve your accounts! You have to approve this application on Metamask.");
            }
        } else if (window.web3) {
            // Legacy dapp browsers or privacy mode off
            window.web3 = new Web3(web3.currentProvider || "ws://localhost:8545");
        
            App.displayAccountInfo();
            return App.initContract();
        } else {
            // Non-dapp browsers...
            console.log(
                "Non-Ethereum browser detected. You should consider trying MetaMask!"
            );
        }
    },

    async displayAccountInfo() {
        const accounts = await web3.eth.getAccounts();
        App.account = accounts[0];
        $('#account').text(App.account);
        
        const balance = await web3.eth.getBalance(App.account);
        $("#accountBalance").text(web3.utils.fromWei(balance, "ether") + " ETH");
    },
    
    async initContract() {
        $.getJSON('ChainList.json', function (artifact) {
            const TruffleContract = window.TruffleContract;
            App.contracts.ChainList = TruffleContract(artifact);
            App.contracts.ChainList.setProvider(window.web3.currentProvider);
            
            App.listenToEvents();

            // retrieve the article from the contract
            return App.reloadArticles();
        });
    },
    
    async reloadArticles() {
        // avoid reentry
        if (App.loading) {
            return;
        }
        App.loading = true;

        // refresh account information because the balance might have changed
        App.displayAccountInfo();

        // retrieve the article placeholder and clear it
        try {
            const chainListInstance = await App.contracts.ChainList.deployed();

            const articleIds = await chainListInstance.getArticlesForSale();

            $('#articlesRow').empty();

            for(let i = 0; i < articleIds.length; i++) {
                const article = await chainListInstance.articles(articleIds[i]);
                App.displayArticle(
                    article.id, 
                    article.seller, 
                    article.name,
                    article.description, 
                    article.price
                );
            }
            App.loading = false;
        } catch (error) {
            App.loading = false;
            console.error(error);
        }
    },

    displayArticle(id, seller, name, description, price) {
        const articlesRow = $('#articlesRow');

        const etherPrice = web3.utils.fromWei(price, "ether");

        const articleTemplate = $("#articleTemplate");
        articleTemplate.find('.panel-title').text(name);
        articleTemplate.find('.article-description').text(description);
        articleTemplate.find('.article-price').text(etherPrice + " ETH");
        articleTemplate.find('.btn-buy').attr('data-id', id);
        articleTemplate.find('.btn-buy').attr('data-value', etherPrice);

        // seller
        if (seller == App.account) {
            articleTemplate.find('.article-seller').text("You");
            articleTemplate.find('.btn-buy').hide();
        } else {
            articleTemplate.find('.article-seller').text(seller);
            articleTemplate.find('.btn-buy').show();
        }

        // add this new article
        articlesRow.append(articleTemplate.html());
    },

    async sellArticle() {
        // retrieve the detail of the article
        const priceNumber = parseFloat($("#article_price").val());
        const articlePrice = isNaN(priceNumber) ? "0" : priceNumber.toString();
        
        const _article_name = $("#article_name").val();
        const _description = $("#article_description").val();
        const _price = web3.utils.toWei(articlePrice, "ether");
        
        if (_article_name.trim() == "" || _price == 0) {
            // nothing to sell
            return false;
        }

        try {
            const chainListInstance = await App.contracts.ChainList.deployed();
            const receipt = await chainListInstance.sellArticle(_article_name, _description, _price, {
                from: App.account,
                gas: 500000
            }).on("transactionHash", function(hash) {
                console.log("Transaction hash: " + hash);
            });
            console.log("Transaction receipt:", receipt);
        } catch (error) {
            console.error(error);
        }
    },

    // Listen to events emitted by the contract
    async listenToEvents() {
        const chainListInstance = await App.contracts.ChainList.deployed()
        if(App.logSellArticleEvent == null) {
            App.logSellArticleEvent = chainListInstance
            .LogSellArticle({ fromBlock: "0" })
            .on("data", event => {
                $('#' + event.id).remove();
                $("#events").append(
                    '<li class="list-group-item" id="' + event.id +'">' + event.returnValues._name + " is for sale" + "</li>"
                );
                App.reloadArticles();
            })
            .on("error", function(error) {
                console.error(error);
            });
        }
        
        if (App.logBuyArticleEvent == null) {
            //listen to LogBuyArticle
            App.logBuyArticleEvent = chainListInstance
                .LogBuyArticle({ fromBlock: '0' })
                .on("data", function(event) {
                    $('#' + event.id).remove();
                    $("#events").append(
                        '<li class="list-group-item" id=' + event.id + '>' + event.returnValues._buyer + ' bought ' + event.returnValues._name + '</li>'
                    );

                    App.reloadArticles();
                })
                .on("error", function(error) {
                    console.error(error);
                });
        }

        // switch visibility of buttons
        $('.btn-subscribe').hide();
        $('.btn-unsubscribe').show();
        $('.btn-show-events').show();
    },

    async stopListeningToEvents() {
        if (App.logSellArticleEvent != null) {
            console.log("Unsubscribe from LogSellArticle");
            await App.logSellArticleEvent.removeAllListeners();
            App.logSellArticleEvent = null;
        }

        if (App.logBuyArticleEvent != null) {
            console.log("Unsubscribe from LogBuyArticle");
            await App.logBuyArticleEvent.removeAllListeners();
            App.logBuyArticleEvent = null;
        }

        // force a close of the events area
        $('#events').collapse('hide');

        // switch visibility of buttons
        $('.btn-show-events').hide();
        $('.btn-unsubscribe').hide();
        $('.btn-subscribe').show();
    },

    async buyArticle() {
        event.preventDefault();

        // retrieve the article's price
        const priceInEther = parseFloat($(event.target).data('value'));
        const articlePrice = isNaN(priceInEther) ? "0" : priceInEther.toString();
        const price = web3.utils.toWei(articlePrice, "ether");
        const articleId = $(event.target).data('id');

        try {
            const chainListInstance = await App.contracts.ChainList.deployed();
            await chainListInstance
                .buyArticle(articleId, {
                    from: App.account,
                    value: price,
                    gas: 500000
                })
                .once('transactionHash', hash => {
                    console.log("transactionHash: " + hash);
                });
        } catch (error) {
            console.error(error.message);
        }
    },
};

$(function () {
    $(window).load(function () {
        App.init();
    });
});
