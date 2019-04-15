"use strict";
/*-----------------------------------------------------------------------------------------
 interface
 -----------------------------------------------------------------------------------------*/
var impGameRules = impGameOperation.extend({
    __init__: function () {
        this._super();
        KBEngine.DEBUG_MSG("Create impGameRules");
        this.tipsList = [];     //提示牌列表
        this.tips_idx = -1;     //提示牌的序号
    },

    getCanWinTiles: function (select_tile, serverSitNum, aid) {
        select_tile = select_tile || 0;
        serverSitNum = serverSitNum || this.serverSitNum;
        aid = aid || const_val.OP_DRAW_WIN;
        // var time1 = (new Date()).getTime();

        //听牌提示
        var canWinTiles = [];
        var handTiles = this.curGameRoom.handTilesList[serverSitNum].concat([]);
        var allTiles = [const_val.CHARACTER, const_val.BAMBOO, const_val.DOT, const_val.WINDS, const_val.DRAGONS]
        var select_tile_pos = handTiles.indexOf(select_tile);
        if(select_tile_pos >= 0){
            handTiles.splice(select_tile_pos, 1);
        }
        if(handTiles.length%3 != 1){
            return canWinTiles
        }
        for (var i = 0; i < allTiles.length; i++) {
            for (var j = 0; j < allTiles[i].length; j++) {
                var t = allTiles[i][j]
                var temp_handTiles = handTiles.concat([t]);
                if (this.canWin(temp_handTiles, t, serverSitNum, aid)) {
                    canWinTiles.push(t);
                }
            }
        }
        // var time2 = (new Date()).getTime();
        // cc.log("getCanWinTiles222 cost = ", time2 - time1);
        return canWinTiles;
    },

    isOpLimit:function (serverSitNum) {
        serverSitNum = serverSitNum || this.serverSitNum;
        return !(this.curGameRoom.discard_king_idx < 0 || this.curGameRoom.discard_king_idx === serverSitNum);
    },

    canDiscardIdx:function (idx) {
        // Note: 回放时不可能用到这个方法，不考虑serverSitNum
        cc.log("canDiscardIdx ",idx);
        cc.log(this.curGameRoom.discard_king_idx, this.curGameRoom.discard_king_idx)
        if (this.curGameRoom.discard_king_idx < 0 || this.curGameRoom.discard_king_idx === this.serverSitNum){
            cc.log("===============")
            return true;
        }
        cc.log("------------------",this.curGameRoom.handTilesList[this.serverSitNum].length)
        return idx === this.curGameRoom.handTilesList[this.serverSitNum].length - 1
    },

    getCanChowTilesList: function (keyTile, serverSitNum) {
        var chowTilesList = [];
        if (this.curGameRoom.kingTiles.indexOf(keyTile) >= 0){
            return chowTilesList
        }
        var intead = keyTile
        if(keyTile === const_val.DRAGON_WHITE && this.curGameRoom.kingTiles.length > 0){
            intead = this.curGameRoom.kingTiles[0]
        }
        if(intead >= const_val.BOUNDARY){
            return chowTilesList
        }
        var tiles = this.curGameRoom.handTilesList[serverSitNum];
        // 预处理
        tiles = cutil.deepCopy(tiles);
        for (let i = 0; i < this.curGameRoom.kingTiles.length; i++){
            cutil.batch_delete(tiles, this.curGameRoom.kingTiles[i]);
        }
        if (this.curGameRoom.kingTiles.length > 0) {
            cutil.batch_replace(tiles, const_val.DRAGON_WHITE, this.curGameRoom.kingTiles[0]);
        }

        var match = [[-2,-1], [-1, 1], [1, 2]];
        for (var i = 0; i < match.length; i++){
            var match_0 = match[i][0] + intead;
            var match_1 = match[i][1] + intead;
            if (tiles.indexOf(match_0) >= 0 && tiles.indexOf(match_1) >= 0){
                if (this.curGameRoom.kingTiles.indexOf(match_0) >= 0) {
                    match_0 = const_val.DRAGON_WHITE;
                }
                if (this.curGameRoom.kingTiles.indexOf(match_1) >= 0) {
                    match_1 = const_val.DRAGON_WHITE;
                }
                chowTilesList.push([keyTile, match_0, match_1]);
            }
        }
        return chowTilesList;
    },

    getDrawOpDict: function (drawTile, serverSitNum) {
        drawTile = drawTile || 0;
        serverSitNum = serverSitNum || this.serverSitNum;
        var op_dict = {}
        var handTiles = this.curGameRoom.handTilesList[serverSitNum];
        var uptiles = this.curGameRoom.upTilesList[serverSitNum];
        if (this.isOpLimit()) {
            //胡
            if (handTiles.length % 3 === 2 && this.canWin(handTiles, drawTile, serverSitNum, const_val.OP_DRAW_WIN)) {
                op_dict[const_val.OP_DRAW_WIN] = [[drawTile]]
            }
            //过
            if (Object.keys(op_dict).length > 0) {
                op_dict[const_val.OP_PASS] = [[drawTile]]
            }
            return op_dict
        }
        //杠
        //接杠
        cc.log(handTiles, uptiles)
        for (var i = 0; i < handTiles.length; i++) {
            for (var j = 0; j < uptiles.length; j++) {
                var upMeld = uptiles[j]
                if (upMeld.length === 3 && upMeld[0] === upMeld[1] && upMeld[1] === upMeld[2] && upMeld[0] === handTiles[i]) {
                    if (!op_dict[const_val.OP_CONTINUE_KONG]) {
                        op_dict[const_val.OP_CONTINUE_KONG] = []
                    }
                    op_dict[const_val.OP_CONTINUE_KONG].push([handTiles[i]])
                }
            }
        }
        //暗杠
        var tile2NumDict = cutil.getTileNumDict(handTiles)
        for (var key in tile2NumDict) {
            if (this.curGameRoom.kingTiles.indexOf(eval(key)) >= 0){
                continue;
            }
            if (tile2NumDict[key] === 4) {
                if (!op_dict[const_val.OP_CONCEALED_KONG]) {
                    op_dict[const_val.OP_CONCEALED_KONG] = []
                }
                op_dict[const_val.OP_CONCEALED_KONG].push([eval(key)])
            }
        }
        //胡
        if (handTiles.length % 3 === 2 && this.canWin(handTiles, drawTile, serverSitNum, const_val.OP_DRAW_WIN)) {
            op_dict[const_val.OP_DRAW_WIN] = [[drawTile]]
        }
        //过
        if (Object.keys(op_dict).length > 0) {
            op_dict[const_val.OP_PASS] = [[drawTile]]
        }
        cc.log("getDrawOpDict==>:", op_dict, drawTile, serverSitNum)
        return op_dict
    },

    getWaitOpDict: function (wait_aid_list, tileList, serverSitNum) {
        serverSitNum = serverSitNum || this.serverSitNum;
        var op_dict = {}
        // 吃碰杠 胡
        for (var i = 0; i < wait_aid_list.length; i++) {
            if (wait_aid_list[i] === const_val.OP_CHOW) { // 吃要特殊处理，告诉服务端吃哪一组
                cc.log("====>:", tileList)
                var canChowTileList = this.getCanChowTilesList(tileList[0], serverSitNum);
                cc.log("====", canChowTileList)
                if (canChowTileList.length > 0) {
                    op_dict[wait_aid_list[i]] = canChowTileList
                }
            } else {
                op_dict[wait_aid_list[i]] = [[tileList[0]]]
            }
        }
         if (Object.keys(op_dict).length > 0) {
            op_dict[const_val.OP_PASS] = [[tileList[0]]]
        }
        cc.log("getWaitOpDict==>", wait_aid_list, tileList, op_dict, serverSitNum);
        return op_dict
    },

    canWin: function (handTiles, finalTile, serverSitNum, aid) {
        //7对 3x+2
        if (handTiles.length % 3 !== 2) {
            return false;
        }
        var handCopyTile = handTiles.concat([]);
        handCopyTile.sort(function(a,b){return a-b;});

        var kingClassified = cutil.classifyKingTiles(handCopyTile, this.curGameRoom.kingTiles);
        var kings   = kingClassified[0];
        var handTilesButKing  = kingClassified[1];

        //白板顶财神
        if(this.curGameRoom.kingTiles.length > 0){
            for (var i = 0; i < handTilesButKing.length; i++){
                if (handTilesButKing[i] === const_val.DRAGON_WHITE){
                    handTilesButKing[i] = this.curGameRoom.kingTiles[0]
                }
            }
        }

        var kingTilesNum = kings.length;
        if(kingTilesNum > 0 && this.curGameRoom.bao_tou){ // 有财必暴
            var tryKingsNum = kingTilesNum;
            var tryTilesButKing = handTilesButKing.concat([]);
            var instead = finalTile;
            if(instead === const_val.DRAGON_WHITE){
                instead = this.curGameRoom.kingTiles[0];
            }
            // 移除最后一张
            if (this.curGameRoom.kingTiles.indexOf(finalTile) >= 0) {
                tryKingsNum -= 1;
            }else {
                tryTilesButKing.splice(handTilesButKing.indexOf(instead), 1)
            }
            if (tryKingsNum <= 0) {
                return false;
            }
            tryKingsNum -= 1; // 这张财神和最后一张牌配对
            // 移除一对后继续
            if(cutil.checkIs6Pairs(tryTilesButKing, tryKingsNum)){
                return true
            }
            return cutil.canNormalWinWithKing3N(tryTilesButKing, tryKingsNum)
        } else {
            if (cutil.checkIs7Pairs(handTilesButKing, kingTilesNum)) {              // 7对
                return true;
            } else if(kingTilesNum > 0){                                            // 有癞子
                return cutil.canNormalWinWithKing3N2(handTilesButKing, kingTilesNum);
            } else {                                                                // 没癞子
                return cutil.canNormalWinWithoutKing3N2(handTilesButKing);
            }
        }
    },

    //——————————————————东阳四副牌相关————————————

    getNextTips:function () {
        this.tips_idx ++;
        if (this.tips_idx >= this.tipsList.length) {
            this.tips_idx = 0;
        }
        return this.tipsList[this.tips_idx];
    },

    getTipsCards:function () {
        var selfCards = this.curGameRoom.playerPokerList[this.serverSitNum];
        cc.log("selfCards:",selfCards);
        var selfRightShiftCards = cutil.rightShiftCards(selfCards);
        selfCards.sort(function(a,b){return a-b;});
        selfRightShiftCards.sort(function(a,b){return a-b;});
        var preCards = cutil.rightShiftCards(this.curGameRoom.controller_discard_list);
        var preCardsType = cutil.getNormalCardsType(preCards);
        var tips = cutil.cardSubSort(selfCards);
        if (this.curGameRoom.controllerIdx == this.serverSitNum && this.curGameRoom.controller_discard_list.length == 0) {
            tips.reverse();
            this.tipsList = tips;
            cc.log("自己任意出牌 getTipsCards:", this.tipsList);
        } else {
            var tips_temp = [];
            for (var i = tips.length - 1 ; i >= 0 ; i--) {
                var cardType = cutil.getNormalCardsType(tips[i]);
                if (cardType == preCardsType) {
                    cc.log("自己任意出牌自己任意出牌:", preCards, tips[i]);
                    if (cutil.cmpSameTypeCards(preCards, tips[i], cardType)) {
                        tips_temp = tips_temp.concat([tips[i],]);
                    }
                } else if (cardType > preCardsType &&  cardType == const_val.TYPE_BOMB) {
                    tips_temp = tips_temp.concat([tips[i],]);
                }
            }
            this.tipsList = tips_temp;
            cc.log("比之前玩家出牌大 getTipsCards:", this.tipsList);
        }
    },

    canPlayCards:function(cards){
        //不能为空
        if (!cards || cards.length <= 0) {
            cc.log("牌不能为空");
            return [false, cards];
        }
        //是否轮到自己出牌
        if (this.curGameRoom.waitIdx != this.serverSitNum) {
            cc.log("没轮到自己出牌");
            return [false, cards];
        }
        //是否有这些牌
        if (!this.checkHasCards(cards)) {
            cc.log("手上没有全部牌:", cards, this.curGameRoom.playerPokerList[this.serverSitNum])
            return [false, cards];
        }
        //测试
        // this.curGameRoom.controller_discard_list = [97,97,98,98, 105,105,106,106, 113,113,114,114]
        // cards = [97,97,98,98, 113,113,114, 129,129,130, 153, 153, 153, 153, 153, 153]

        if (this.canPlayNormalCards(cards)) {
            cc.log("玩家正常出牌", cards);
            return [true, cards];
        }
        return [false, cards];
    },

    checkHasCards:function(cards){
        var cards2NumDict = cutil.getTileNumDict(cutil.rightShiftCards(cards));
        var playerCards2NumDict = cutil.getTileNumDict(cutil.rightShiftCards(this.curGameRoom.playerPokerList[this.serverSitNum]));
        for (var card in cards2NumDict) {
            if ((card == 18 || card == 19) && (cards2NumDict[18] || cards2NumDict[19] > 0)){
                var kingSmallNum =playerCards2NumDict[18] || 0;
                var kingBigNum =playerCards2NumDict[19] || 0;
                if (kingSmallNum + kingBigNum >= 4 && kingSmallNum + kingBigNum != cards.length) {
                    return false;
                }
            }
            if (playerCards2NumDict[card] && cards2NumDict[card] == playerCards2NumDict[card]) {
                return true;
            }
        }
        return false;
    },

    canPlayNormalCards:function(cards){
        cc.log("判断cards是否能出 canPlayNormalCards:",cards);
        var playerTransferCards = cutil.rightShiftCards(cards);
        var controllerDiscardTransferCards = cutil.rightShiftCards(this.curGameRoom.controller_discard_list);
        var playerCardsType = cutil.getNormalCardsType(playerTransferCards);
        cc.log("上次的牌:", controllerDiscardTransferCards, "出的牌:", playerTransferCards, "出牌类型:", playerCardsType);
        if (playerCardsType == 0 || playerCardsType == 1) {
            cc.log("牌型不正确");
            return false;
        }
        //自由出牌
        if (this.curGameRoom.controllerIdx == this.serverSitNum && this.curGameRoom.controller_discard_list.length == 0) { //其他玩家要不起 或 该局第一次出牌 牌出完 controllerIdx转移到下家
            cc.log("玩家自由出牌");
            return true;
        }
        //压过上家
        var controllerCardsType = cutil.getNormalCardsType(controllerDiscardTransferCards);
        cc.log("controllerCardsType",controllerCardsType);
        if (controllerCardsType == playerCardsType) {
            var result = cutil.cmpSameTypeCards(controllerDiscardTransferCards, playerTransferCards, playerCardsType);
            cc.log(result);
            return result;
        } else{
            if (controllerCardsType < const_val.TYPE_BOMB && playerCardsType < const_val.TYPE_BOMB) {
                return false;
            } else if (controllerCardsType < const_val.TYPE_BOMB && playerCardsType == const_val.TYPE_BOMB) {
                return true;
            } else if (playerCardsType < const_val.TYPE_BOMB && controllerCardsType == const_val.TYPE_BOMB) {
                return false;
            }
        }
        return false;
    },
});
