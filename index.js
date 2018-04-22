"use strict";

var Alexa = require("alexa-sdk");
const axios = require('axios');
var slug = require('slug');
const dashbot = require('dashbot')('HKEccNUZrdISACF995MbXEapbApSzjyLgjCOxkJ6').alexa;
var temp = 0.0;

var handlers = {
   "LaunchRequest": function () {
       if(!this.attributes.userId){
           this.attributes.pastValue = 0.0;
           this.response.speak("Welcome to Crypto Manager. Keep track of your personal crypto portfolio using Alexa. What is your name? ").listen("Tell me your name!"); 
           this.emit(":responseReady");
       }
       else{
        updateCryptoPrices(this.attributes.portfolio);
        setTimeout(() => {
            this.attributes.currentValue = getCurrentPortfolioValue(this.attributes.portfolio);
            this.emit("customIntent");
          }, 2500)
       }
       
   },
   "customIntent": function () {
           this.attributes.currentValue = getCurrentPortfolioValue(this.attributes.portfolio);
           temp = this.attributes.currentValue;
           this.response.speak(`Welcome back, ${this.attributes.name}. The current value of your portfolio is ${this.attributes.currentValue}$. ${this.attributes.pastValue != 0.0 ? `It has changed by ${getCurrentPortfolioChange(this.attributes.pastValue, this.attributes.currentValue)} percent since the last time you checked!` : ""} What do you want to do?`).listen("You can Add, Update, Delete coins from your portoflio and also get the real time value of your portfolio in US dollars as well as alternate fiat currencies like pound, rupees, euro, yen etc.!"); 
           this.emit(":responseReady");
   },
   "NameIntent": function () {
        this.attributes.name = slotValue(this.event.request.intent.slots.name);
        this.attributes.userId = this.event.session.user.userId;
        this.response.speak(`Hi ${this.attributes.name}. You can add the amount of crypto currencies you own and can check it's value whenever you want. You can ${this.attributes.portfolio ? "see the current value of your portfolio or " : ""}add new cryptocurrencies to your portfolio. Which cryptocurrency do you want to add?`).listen("You can Add, Update, Delete coins from your portoflio and also get the real time value of your portfolio in US dollars as well as alternate fiat currencies like pound, rupees, euro, yen etc.!"); 
           this.emit(":responseReady");
       
   },
   "newCryptosIntent": function () {
        if(!this.attributes.portfolio){
            this.attributes.portfolio = {};
        }
        var filledSlots = delegateSlotCollection.call(this);
        var newCrypto = slug(slotValue(this.event.request.intent.slots.crypto));
        var amount = slotValue(this.event.request.intent.slots.amount);
        var fractionAmount = slotValue(this.event.request.intent.slots.fractionamount);
        var totalAmount = `${amount}${fractionAmount != "undefined" ? `.${fractionAmount}` : ""}`;
        this.attributes.portfolio[newCrypto] = [];
        axios.get(`http://api.coinmarketcap.com/v1/ticker/${newCrypto}/`)
        .then( res => res.data)
        .then( res => res[0])
        .then( res => {
            this.attributes.portfolio[newCrypto] = [parseFloat(totalAmount),parseFloat(res.price_usd).toFixed(4) > 0.0000 ? parseFloat(res.price_usd).toFixed(4) : parseFloat(res.price_usd).toFixed(8)];
            console.log(this.attributes.portfolio);
            this.response.speak(`${this.attributes.name}, You added <say-as interpret-as="unit">${this.attributes.portfolio[newCrypto][0]}</say-as> ${newCrypto} . Say add new cryptocurrency if you want to add any other cryptocurrency.`).listen("You can Add, Update, Delete coins from your portoflio and also get the real time value of your portfolio in US dollars as well as alternate fiat currencies like pound, rupees, euro, yen etc.!"); 
            this.emit(":responseReady");
        })
        .catch( err => {
            delete this.attributes.portfolio[newCrypto];
            this.response.speak(`Sorry, that cryptocurrency is currently not in our database! What else do you want to know about?`).listen("You can Add, Update, Delete coins from your portoflio and also get the real time value of your portfolio in US dollars as well as alternate fiat currencies like pound, rupees, euro, yen etc.!");
            this.emit(":responseReady");
        });       
   },
   "removeCryptosIntent": function () {
        var filledSlots = delegateSlotCollection.call(this);
        var newCrypto = slug(slotValue(this.event.request.intent.slots.crypto));
        console.log(this.attributes.portfolio + "in remove intent");
        console.log(newCrypto);
        if(newCrypto == "undefined"){
            this.response.speak(`Sorry, that cryptocurrency is currently nor in your portfolio and neither in our database! What else do you want to do?`).listen("You can Add, Update, Delete coins from your portoflio and also get the real time value of your portfolio in US dollars as well as alternate fiat currencies like pound, rupees, euro, yen etc.!");
            this.emit(":responseReady");
        }
        if(!this.attributes.portfolio.hasOwnProperty(newCrypto)){
            this.response.speak(`${this.attributes.name}, The cryptocurrency ${newCrypto} already does not exist in your portfolio! What else do you want to do?`).listen("You can Add, Update, Delete coins from your portoflio and also get the real time value of your portfolio in US dollars as well as alternate fiat currencies like pound, rupees, euro, yen etc.!");
            this.emit(":responseReady");
        }
        console.log(this.attributes.portfolio + "in remove succeed");
        console.log(newCrypto);
        console.log(this.attributes.portfolio[newCrypto]);
        delete this.attributes.portfolio[newCrypto];
        console.log(this.attributes.portfolio + "in remove succeed after delete");
        this.response.speak(`${this.attributes.name}, The cryptocurrency ${newCrypto} has been removed from your portfolio! What else do you want to do?`).listen("You can Add, Update, Delete coins from your portoflio and also get the real time value of your portfolio in US dollars as well as alternate fiat currencies like pound, rupees, euro, yen etc.!");
        this.emit(":responseReady");
   },
   "updateCryptosIntent": function () {
        var filledSlots = delegateSlotCollection.call(this);
        var newCrypto = slug(slotValue(this.event.request.intent.slots.crypto));
        var amount = slotValue(this.event.request.intent.slots.newamount);
        var fractionAmount = slotValue(this.event.request.intent.slots.newfraction);
        var totalAmount = `${amount}${fractionAmount != "undefined" ? `.${fractionAmount}` : ""}`;
        if(newCrypto == "undefined"){
            this.response.speak(`Sorry, that cryptocurrency is currently nor in your portfolio and neither in our database! What else do you want to do?`).listen("You can Add, Update, Delete coins from your portoflio and also get the real time value of your portfolio in US dollars as well as alternate fiat currencies like pound, rupees, euro, yen etc.!");
            this.emit(":responseReady");
        } 


        if(this.attributes.portfolio.hasOwnProperty(newCrypto)){

            axios.get(`http://api.coinmarketcap.com/v1/ticker/${newCrypto}/`)
            .then( res => res.data)
            .then( res => res[0])
            .then( res => {
                this.attributes.portfolio[newCrypto] = [parseFloat(totalAmount),parseFloat(res.price_usd).toFixed(4) > 0.0000 ? parseFloat(res.price_usd).toFixed(4) : parseFloat(res.price_usd).toFixed(8)];
                this.response.speak(`${this.attributes.name}, You updated <say-as interpret-as="unit">${this.attributes.portfolio[newCrypto][0]}</say-as> ${newCrypto} . Say update cryptocurrency if you want to update any other cryptocurrency.`).listen("You can Add, Update, Delete coins from your portoflio and also get the real time value of your portfolio in US dollars as well as alternate fiat currencies like pound, rupees, euro, yen etc.!"); 
                this.emit(":responseReady");
            })
            .catch( err => {
                this.response.speak(`Sorry, that cryptocurrency is currently not in our database! What else do you want to do?`).listen("You can Add, Update, Delete coins from your portoflio and also get the real time value of your portfolio in US dollars as well as alternate fiat currencies like pound, rupees, euro, yen etc.!");
                this.emit(":responseReady");
            });    
        }
        else{
            this.response.speak(`The cryptocurrency ${newCrypto} does not exist in your portfolio! What else do you want to do?`).listen("You can Add, Update, Delete coins from your portoflio and also get the real time value of your portfolio in US dollars as well as alternate fiat currencies like pound, rupees, euro, yen etc.!");
            this.emit(":responseReady");
        }
   },
   "describeIntent": function () {
        if(Object.keys(this.attributes.portfolio).length == 0){
            this.response.speak(`Your portfolio is currently empty ${this.attributes.name}! Do you want to add new cryptocurrencies to your portfolio?`).listen("You can Add, Update, Delete coins from your portoflio and also get the real time value of your portfolio in US dollars as well as alternate fiat currencies like pound, rupees, euro, yen etc.!");
            this.emit(":responseReady");
        }
        updateCryptoPrices(this.attributes.portfolio);
        setTimeout(() => {
            this.attributes.currentValue = getCurrentPortfolioValue(this.attributes.portfolio);
            let say = `${this.attributes.name}, you hold, `;
            for (let [key, value] of Object.entries(this.attributes.portfolio)) {
                let worth = parseFloat(value[0])*parseFloat(value[1]);
                say +=`${value[0]} ${key}, worth ${parseFloat(worth).toFixed(2)}$. `;
            }
            this.response.speak(`${say}Also the current total value of your portfolio is ${this.attributes.currentValue}$! What else do you want to know about?`).listen("You can Add, Update, Delete coins from your portoflio and also get the real time value of your portfolio in US dollars as well as alternate fiat currencies like pound, rupees, euro, yen etc.!");
            this.emit(":responseReady");
          }, 2500)        
   },
   "getValueOfPortfolioIntent": function () {
        updateCryptoPrices(this.attributes.portfolio);
        setTimeout(() => {
            this.attributes.currentValue = getCurrentPortfolioValue(this.attributes.portfolio);
            this.response.speak(`The value of your portfolio is <say-as interpret-as="unit">${this.attributes.currentValue}</say-as>$! What else do you want to know about?`).listen("You can Add, Update, Delete coins from your portoflio and also get the real time value of your portfolio in US dollars as well as alternate fiat currencies like pound, rupees, euro, yen etc.!");
            this.emit(":responseReady");
        }, 2500)  
   },
   "getChangeOfPortfolioIntent": function () {
        updateCryptoPrices(this.attributes.portfolio);
        setTimeout(() => {
            this.attributes.currentValue = getCurrentPortfolioValue(this.attributes.portfolio);
            this.response.speak(`${this.attributes.pastValue != 0.0 ? `The value of your portfolio has changed by ${getCurrentPortfolioChange(this.attributes.pastValue, this.attributes.currentValue)} percent since the last time you checked` : `Your portfolio has increased by ${this.attributes.currentValue}$`}! What else do you want to know about?`).listen("You can Add, Update, Delete coins from your portoflio and also get the real time value of your portfolio in US dollars as well as alternate fiat currencies like pound, rupees, euro, yen etc.!");
            this.emit(":responseReady");
    }, 2500)  
   },
   "getValueOfPortfolioInAltIntent": function () {
        var fiatName = slotValue(this.event.request.intent.slots.fiat);
        updateCryptoPricesInAlt(this.attributes.portfolio,fiatName);
        setTimeout(() => {
            let tempkey;
            for (let [key, value] of Object.entries(this.attributes.portfolio)) { 
                tempkey = key;
                break;
            }
            if(this.attributes.portfolio[tempkey][1] != -1){
                this.attributes.currentValue = getCurrentPortfolioValue(this.attributes.portfolio);
                if(isNaN(this.attributes.currentValue)){
                    this.response.speak(`Sorry, that fiat currency is currently not supported! What else do you want to know about?`).listen("You can Add, Update, Delete coins from your portoflio and also get the real time value of your portfolio in US dollars as well as alternate fiat currencies like pound, rupees, euro, yen etc.!");
                    this.emit(":responseReady");
                }
                this.response.speak(`The value of your portfolio is <say-as interpret-as="unit">${this.attributes.currentValue}</say-as> ${fiatName}! What else do you want to know about?`).listen("You can Add, Update, Delete coins from your portoflio and also get the real time value of your portfolio in US dollars as well as alternate fiat currencies like pound, rupees, euro, yen etc.!");
                this.emit(":responseReady");
            }
            else{
                this.response.speak(`Sorry, that fiat currency is currently not supported! What else do you want to know about?`).listen("You can Add, Update, Delete coins from your portoflio and also get the real time value of your portfolio in US dollars as well as alternate fiat currencies like pound, rupees, euro, yen etc.!");
                this.emit(":responseReady");
            }
          }, 3500)  
    },
    


   'SessionEndedRequest': function () {
        if(this.attributes.name  && this.attributes.portfolio){
            updateCryptoPrices(this.attributes.portfolio);
            setTimeout(() => {
                this.attributes.pastValue = getCurrentPortfolioValue(this.attributes.portfolio);
                this.emit(':saveState', true);
              }, 1500)
        }
        else {
            this.emit(':saveState', true);
        }
        

   },
    'AMAZON.HelpIntent': function () {
        this.response.speak('You can Add, Update, Delete coins from your portoflio and also get the real time value of your portfolio in US dollars as well as alternate fiat currencies like pound, rupees, euro, yen etc. Please see the skill\'s description in the Alexa App for further instructions!').listen('You can Add, Update, Delete coins from your portoflio and also get the real time value of your portfolio in US dollars as well as alternate fiat currencies like pound, rupees, euro, yen etc.!');
        this.emit(':responseReady');
    },
    'AMAZON.CancelIntent': function () {
        if(this.attributes.name && this.attributes.portfolio){
            updateCryptoPrices(this.attributes.portfolio);
            setTimeout(() => {
                this.attributes.pastValue = getCurrentPortfolioValue(this.attributes.portfolio);
                this.response.speak('Say Alexa, open Crypto Manager whenever you want to interact with your portfolio again. Goodbye!');
                this.emit(':responseReady');
            }, 1500)
        }
        else {
            this.response.speak('Say Alexa, open Crypto Manager whenever you want to interact with your portfolio again. Goodbye!');
            this.emit(':responseReady');
        }
    },
    'AMAZON.StopIntent': function () {
        if(this.attributes.name  && this.attributes.portfolio){
            updateCryptoPrices(this.attributes.portfolio);
            setTimeout(() => {
                this.attributes.pastValue = getCurrentPortfolioValue(this.attributes.portfolio);
                this.response.speak('Say Alexa, open Crypto Manager whenever you want to interact with your portfolio again. Goodbye!');
                this.emit(':responseReady');
            }, 1500)
        }
        else {
            this.response.speak('Say Alexa, open Crypto Manager whenever you want to interact with your portfolio again. Goodbye!');
            this.emit(':responseReady');
        }
    },

};


function updateCryptoPricesInAlt(portfolio,alt){
    for (let [key, value] of Object.entries(portfolio)) {  
        
        axios.get(`http://api.coinmarketcap.com/v1/ticker/${key}/?convert=${alt}`)
        .then( res => res.data)
        .then( res => res[0])
        .then( res => {
            
            let pricefiat = `price_${(alt).toLowerCase()}`;
            if(res[pricefiat]){
                portfolio[key][1] = parseFloat(res[pricefiat]).toFixed(4) > 0.0000 ? parseFloat(res[pricefiat]).toFixed(4) : parseFloat(res[pricefiat]).toFixed(8);
            }
            else{
                portfolio[key][1] = -1;
            }
        })
        .catch( err => {
            delete portfolio[key];
        });

    }    
}





function slotValue(slot, useId){
    if(slot.value == undefined){
        return "undefined";
    }
    let value = slot.value;
    let resolution = (slot.resolutions && slot.resolutions.resolutionsPerAuthority && slot.resolutions.resolutionsPerAuthority.length > 0) ? slot.resolutions.resolutionsPerAuthority[0] : null;
    if(resolution && resolution.status.code == 'ER_SUCCESS_MATCH'){
        let resolutionValue = resolution.values[0].value;
        value = resolutionValue.id && useId ? resolutionValue.id : resolutionValue.name;
    }
    return value;
}

function updateCryptoPrices(portfolio) {
    for (let [key, value] of Object.entries(portfolio)) { 

        axios.get(`http://api.coinmarketcap.com/v1/ticker/${key}/`)
        .then( res => res.data)
        .then( res => res[0])
        .then( res => {
            portfolio[key][1] = parseFloat(res.price_usd).toFixed(4) > 0.0000 ? parseFloat(res.price_usd).toFixed(4) : parseFloat(res.price_usd).toFixed(8);
        })
        .catch( err => {
            delete portfolio[key];
        });
    }
}

function getCurrentPortfolioValue(portfolio){
    let totalvalue = 0.0;
    for (let [key, value] of Object.entries(portfolio)) {  
        totalvalue +=parseFloat(portfolio[key][0])*parseFloat(portfolio[key][1]);
    }
    return parseFloat(totalvalue).toFixed(2);
}

function getCurrentPortfolioChange(oldNumber, newNumber){
    var decreaseValue = newNumber - oldNumber ;
    return parseFloat((decreaseValue / oldNumber) * 100).toFixed(2);
}

function delegateSlotCollection(){
    console.log("in delegateSlotCollection");
    console.log("current dialogState: "+this.event.request.dialogState);
      if (this.event.request.dialogState === "STARTED") {
        console.log("in Beginning");
        var updatedIntent=this.event.request.intent;
        //optionally pre-fill slots: update the intent object with slot values for which
        //you have defaults, then return Dialog.Delegate with this updated intent
        // in the updatedIntent property
        this.emit(":delegate", updatedIntent);
      } else if (this.event.request.dialogState !== "COMPLETED") {
        console.log("in not completed");
        // return a Dialog.Delegate directive with no updatedIntent property.
        this.emit(":delegate");
      } else {
        console.log("in completed");
        console.log("returning: "+ JSON.stringify(this.event.request.intent));
        // Dialog is now complete and all required slots should be filled,
        // so call your normal intent handler.
        return this.event.request.intent;
      }
  }

if (!Object.entries)
  Object.entries = function( obj ){
    var ownProps = Object.keys( obj ),
        i = ownProps.length,
        resArray = new Array(i); // preallocate the Array
    while (i--)
      resArray[i] = [ownProps[i], obj[ownProps[i]]];
    
    return resArray;
};

// This is the function that AWS Lambda calls every time Alexa uses your skill.
exports.handler = dashbot.handler(function(event, context, callback) {

// Set up the Alexa object
const alexa = Alexa.handler(event, context, callback);
// Register Handlers
alexa.registerHandlers(handlers); 

alexa.dynamoDBTableName = 'cryptoManager';

// Start our Alexa code
alexa.execute(); 
  
});
