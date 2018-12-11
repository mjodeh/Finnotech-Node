/*jslint node: true */
"use strict";
const request = require('request-promise');
const util = require('util');
const uuid = require('uuid/v4');
const config = require('./config');

class Token{
    constructor(token,refreshToken,creationDate,expiryDate){
        this.token = token;
        this.refreshToken = refreshToken;
        this.creationDate = creationDate;
        this.expiryDate = expiryDate;
    }
}

class Finnotech{
    constructor(){
        this.applicationId = config.applicationId;
        this.clientId = config.clientId;
        this.redirectUri = config.redirectUri;
        this.scope = config.scope;
        this.limit = config.limit;
        this.count = config.count;
        this.destination = config.destination;
        this.nationalCode = config.nationalCode;
        this.responseType = config.responseType;
    }

    async getPassword(){
        try{
            return Buffer.from(this.applicationId + ":" +this.clientId).toString("base64");
        }
        catch(ex){
            throw ex;
        }
    }

    async getToken(){
        try{
            let password = this.applicationId + ":" +this.clientId;
            password = Buffer.from(password).toString("base64");
    
            let requestOptions = {
                uri:"https://sandbox.finnotech.ir/dev/v1/oauth2/token",
                json:true,
                method:"POST",
                body:{
                    "grant_type": "client_credentials",
                    "nid": this.nationalCode
                },
                headers:{
                    "Authorization":"Basic " + password
                }
            };
    
            let temp = await request(requestOptions);
            this.token = new Token(temp.access_token.value,temp.access_token.refreshToken,temp.access_token.creationDate,temp.access_token.lifeTime);
            return this;
        }
        catch(ex){
            throw ex;
        }
    }

    async getRefreshToken(){
        try{
            if(typeof(this.token) == "undefined"){
                await this.getToken();
                return this;
            }

            let password = this.applicationId + ":" + this.clientId;
            password = Buffer.from(password).toString("base64");
    
            let requestOptions = {
                uri:"https://sandbox.finnotech.ir/dev/v1/oauth2/token",
                json:true,
                method:"POST",
                body:{
                    "grant_type": "refresh_token",
                    "refresh_token": this.token.refreshToken
                },
                headers:{
                    "Authorization":"Basic " + password
                }
            };
    
            let temp = await request(requestOptions);
            this.token = new Token(temp.access_token.value,temp.access_token.refreshToken,temp.access_token.creationDate,temp.access_token.lifeTime);
            return this;
        }
        catch(ex){
            throw ex;
        }
    }

    async getRedirectLink(){
        return `https://sandbox.finnotech.ir/dev/v1/oauth2/authorize?client_id=${this.client_id}&response_type=${this.response_type}&redirect_uri=${this.redirect_uri}&scope=${this.scope}&limit=${this.limit}&count=${this.count}&destination=${this.destination}`;
    }

    async getOauthToken(responseCode){
        if(util.isNullOrUndefined(responseCode) === true || util.isString(responseCode) === false || responseCode === ""){
            this.oauthToken = null;
            return this;
        }

        if(util.isNullOrUndefined(this.token) === true){
            await this.getToken();
        }
        
        try{
            let body = {
                grant_type: "authorization_code",
                code: responseCode,
                redirect_uri: this.redirect_uri
            };
            
            let password = await this.tokenManagement.getPassword();
            let options = {
                uri: "https://sandbox.finnotech.ir/dev/v1/oauth2/authorize",
                method: "POST",
                json: true,
                body: body,
                headers:{
                    "Authorization":"Basic " + password
                }
            };

            this.oauthToken = await request(options);
            return this;
        }
        catch(ex){
            throw(ex);
        }
    }
    
    async withdrawalFrom(nid,paymentNumber,destinationNumber,description,amount){
        if(util.isNullOrUndefined(nid) === true || util.isString(nid) === false || nid === ""){
            throw new Error(`nid must be a non empty string`);
        }

        if(util.isNullOrUndefined(this.oauthToken) === true){
            await this.getOauthToken();
        }
        
        try{            
            let body = { 
                paymentNumber,
                destinationNumber,
                description,
                amount
            };
            
            let options = {
                uri: `https://sandbox.finnotech.ir/oak/v1/${nid}/withdrawalFrom?trackId=${uuid()}`,
                method: "POST",
                json: true,
                body: body,
                headers:{
                    "Authorization":"Bearer " + this.oauthToken.access_token.value
                }
            };

            let result = await request(options);
            return result;
        }
        catch(ex){
            throw(ex);
        }
    }

    async chargeCard(clientId,deposit,amount, card){
        if(util.isNullOrUndefined(clientId) === true || util.isString(clientId) === false || clientId === ""){
            throw new Error(`clientId must be a non empty string`);
        }

        if(util.isNullOrUndefined(deposit) === true || util.isString(deposit) === false || deposit === ""){
            throw new Error(`deposit must be a non empty string`);
        }

        if(util.isNullOrUndefined(this.token) === true){
            await this.getToken();
        }
        
        try{            
            let body = { 
                card,
                amount
            };
            
            let options = {
                uri: `https://sandbox.finnotech.ir/oak/v1/clients/${clientId}/deposits/${deposit}/chargeCard?trackId=${uuid()}`,
                method: "POST",
                json: true,
                body: body,
                headers:{
                    "Authorization":"Bearer " + this.token.token
                }
            };

            let result = await request(options);
            return result;
        }
        catch(ex){
            throw(ex);
        }
    }

    async cardBalance(clientId,deposit,card){
        if(util.isNullOrUndefined(clientId) === true || util.isString(clientId) === false || clientId === ""){
            throw new Error(`clientId must be a non empty string`);
        }

        if(util.isNullOrUndefined(deposit) === true || util.isString(deposit) === false || deposit === ""){
            throw new Error(`deposit must be a non empty string`);
        }

        if(util.isNullOrUndefined(this.token) === true){
            await this.getToken();
        }
        
        try{            
            let body = { 
                card
            };
            
            let options = {
                uri: `https://sandbox.finnotech.ir/oak/v1/clients/${clientId}/card/balance?trackId=${uuid()}`,
                method: "POST",
                json: true,
                body: body,
                headers:{
                    "Authorization":"Bearer " + this.token.token
                }
            };

            let result = await request(options);
            return result;
        }
        catch(ex){
            throw(ex);
        }
    }

    async cardStatement(clientId,card,from,to){
        if(util.isNullOrUndefined(clientId) === true || util.isString(clientId) === false || clientId === ""){
            throw new Error(`clientId must be a non empty string`);
        }

        if(util.isNullOrUndefined(from) === true || util.isString(from) === false || from === ""){
            throw new Error(`from must be a non empty string`);
        }

        if(util.isNullOrUndefined(to) === true || util.isString(to) === false || to === ""){
            throw new Error(`from must be a non empty string`);
        }

        if(util.isNullOrUndefined(this.token) === true){
            await this.getToken();
        }
        
        try{            
            let body = { 
                card,
                from,
                to
            };
            
            let options = {
                uri: `https://sandbox.finnotech.ir/oak/v1/clients/${clientId}/card/statement?trackId=${uuid()}`,
                method: "POST",
                json: true,
                body: body,
                headers:{
                    "Authorization":"Bearer " + this.token.token
                }
            };

            let result = await request(options);
            return result;
        }
        catch(ex){
            throw(ex);
        }
    }

    async transfereTo(nid, clientId,amount,description,destinationFirstname,destinationLastname,destinationNumber,paymentNumber){
        if(util.isNullOrUndefined(clientId) === true || util.isString(clientId) === false || clientId === ""){
            throw new Error(`clientId must be a non empty string`);
        }

        if(util.isNullOrUndefined(nid) === true || util.isString(nid) === false || nid === ""){
            throw new Error(`clientId must be a non empty string`);
        }

        if(util.isNullOrUndefined(this.token) === true){
            await this.getToken();
        }
        
        try{            
            let body = { 
                amount,
                description,
                destinationFirstname,
                destinationLastname,
                destinationNumber,
                paymentNumber
            };
            
            let options = {
                uri: `https://sandbox.finnotech.ir/oak/v1/${nid}/clients/${clientId}/transferTo?trackId=${uuid()}`,
                method: "POST",
                json: true,
                body: body,
                headers:{
                    "Authorization":"Bearer " + this.token.token
                }
            };

            let result = await request(options);
            return result;
        }
        catch(ex){
            throw(ex);
        }
    }
}

module.exports = {
    Finnotech
}