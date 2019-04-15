"use strict";
/*-----------------------------------------------------------------------------------------
												interface
-----------------------------------------------------------------------------------------*/
var impGameOperation = impCommunicate.extend({
	__init__ : function()
	{
		this._super();
		this.diceList = [[0,0],[0,0],[0,0],[0,0]]
		this.startTilesList = []
		this.runMode = const_val.GAME_ROOM_GAME_MODE;
		this.startActions = {};
		this.countNum = -1;
	    KBEngine.DEBUG_MSG("Create impRoomOperation");
  	},

	startGame : function(dealerIdx, tileList, swap_list){
		cc.log("startGame")
		cc.log(dealerIdx, tileList, swap_list);
		var self = this;
		if(!this.curGameRoom){
			return;
		}
		//交换位置 玩家当前在服务端的位置也改变
		cc.log(this.curGameRoom.playerInfoList)
		var enterPlayerInfoList = cutil.deepCopy(this.curGameRoom.playerInfoList);
		cc.log(enterPlayerInfoList)
		this.serverSitNum = swap_list.indexOf(this.serverSitNum);
		this.curGameRoom.swap_seat(swap_list);

		this.runMode = const_val.GAME_ROOM_GAME_MODE;
		this.curGameRoom.startGame();
		this.curGameRoom.curPlayerSitNum = dealerIdx;
		this.curGameRoom.dealerIdx = dealerIdx;
        this.curGameRoom.controllerIdx = dealerIdx;
        this.curGameRoom.waitIdx = dealerIdx;
		// this.curGameRoom.prevailing_wind = prevailing_wind;
		// this.curGameRoom.playerWindList = playerWindList;
		// this.curGameRoom.cur_dealer_mul = cur_dealer_mul;
        cutil.tileSort(tileList);
        tileList = cutil.cardSort(tileList);

		this.startTilesList = cutil.deepCopy(this.curGameRoom.playerPokerList);
		this.startTilesList[this.serverSitNum] = tileList.concat([]);
		cc.log("startGame", this.startTilesList[this.serverSitNum]);

        if (this.serverSitNum == dealerIdx) {
        //     var drawTile = tileList.pop() // 庄家最后一张牌是牌局开始后摸上来的不参与排序
            this.curGameRoom.playerPokerList[this.serverSitNum] = tileList;
			// cutil.tileSort(this.curGameRoom.playerPokerList[this.serverSitNum]);
        //     this.curGameRoom.lastDrawTile = drawTile
        //     //庄家最后一张牌放最后
        //     this.curGameRoom.handTilesList[this.serverSitNum].push(drawTile)
        //     this.curGameRoom.last_op = const_val.OP_DRAW;
        } else {
            this.curGameRoom.playerPokerList[this.serverSitNum] = tileList;
            // cutil.tileSort(this.curGameRoom.playerPokerList[this.serverSitNum]);
        //     this.curGameRoom.handTilesList[dealerIdx].push(0) //庄家开局多一张牌的
        }

        cc.log("this.curGameRoom.playerPokerList[this.serverSitNum]:",this.curGameRoom.playerPokerList[this.serverSitNum]);

		if(h1global.curUIMgr.gameroomprepare_ui){
			h1global.curUIMgr.gameroomprepare_ui.hide();
		}

		this.startActions["GameRoomUI"] = function() {
        	h1global.curUIMgr.roomLayoutMgr.notifyObserver(const_val.GAME_ROOM_UI_NAME, "startBeginAnim",self.startTilesList, dealerIdx);
            if (onhookMgr && const_val.FAKE_COUNTDOWN > 0) {
                onhookMgr.setWaitLeftTime(const_val.FAKE_COUNTDOWN + const_val.FAKE_BEGIN_ANIMATION_TIME);
            }
            // cc.audioEngine.playEffect("res/sound/effect/saizi_music.mp3");
        }

        if(this.curGameRoom.curRound <= 1) {
            this.startActions["GameRoomScene"] = function(){
                if (h1global.curUIMgr.gameroominfo_ui) {
                	if(h1global.curUIMgr.gameroominfo_ui.is_show){
                        h1global.curUIMgr.gameroominfo_ui.hide();
                    }
                    h1global.curUIMgr.gameroominfo_ui.show();
                }
                if (const_val.SHOW_SWAP_SEAT){
                    if (h1global.curUIMgr.gameroomprepare_ui && !h1global.curUIMgr.gameroomprepare_ui.is_show){
                        // h1global.curUIMgr.gameroomprepare_ui.show_prepare(0, enterPlayerInfoList, function () {
                        //     for(var i=0; i< self.curGameRoom.playerInfoList.length; i++){
                        //         h1global.curUIMgr.gameroomprepare_ui.update_player_info_panel(i, self.curGameRoom.playerInfoList[i]);
                        //     }
                        // })

                        h1global.curUIMgr.showGameRoomUI(function(complete){
                            if(complete){
                                let player2 = h1global.entityManager.player();
                                if (player2 && player2.startActions["GameRoomUI"]) {
                                    player2.startActions["GameRoomUI"]();
                                    player2.startActions["GameRoomUI"] = undefined;
                                }
                                h1global.curUIMgr.setGameRoomUI2Top(cc.sys.localStorage.getItem("GAME_ROOM_UI"))
                            }
                        });
                        // h1global.curUIMgr.gameroomprepare_ui.show_prepare(0, enterPlayerInfoList, function () {
                        //     h1global.curUIMgr.gameroomprepare_ui.swap_seat(swap_list);
                        // })
                    }
				} else {
                    if(h1global.curUIMgr.gps_ui){
                        h1global.curUIMgr.gps_ui.show();
                    }
				}



			}
		}
        if(h1global.curUIMgr.roomLayoutMgr){
			// 如果GameRoomScene已经加载完成
			if(this.startActions["GameRoomScene"]) {
                this.startActions["GameRoomScene"]();
                this.startActions["GameRoomScene"] = undefined;
            } else {
                if(h1global.curUIMgr.gameroom3d_ui && h1global.curUIMgr.gameroom2d_ui){
                    h1global.curUIMgr.roomLayoutMgr.notifyObserver(const_val.GAME_ROOM_UI_NAME, "hide");
                    h1global.curUIMgr.showGameRoomUI(function(complete){
                        if(complete){
                            if (self.startActions["GameRoomUI"]) {
                                self.startActions["GameRoomUI"]();
                                self.startActions["GameRoomUI"] = undefined;
                            }
                            h1global.curUIMgr.setGameRoomUI2Top(cc.sys.localStorage.getItem("GAME_ROOM_UI"))
                        }
                    });
                }
			}
        }

		if(h1global.curUIMgr.gameroominfo_ui && h1global.curUIMgr.gameroominfo_ui.is_show){
			h1global.curUIMgr.gameroominfo_ui.update_round();
			// h1global.curUIMgr.gameroominfo_ui.update_round_wind(prevailing_wind);
		}
		if(h1global.curUIMgr.gameconfig_ui && h1global.curUIMgr.gameconfig_ui.is_show){
			h1global.curUIMgr.gameconfig_ui.update_state();
		}
		// 关闭结算界面
		if(h1global.curUIMgr.settlement_ui){
			h1global.curUIMgr.settlement_ui.hide();
		}
		if(h1global.curUIMgr.result_ui){
			h1global.curUIMgr.result_ui.hide();
		}

	},

	readyForNextRound : function(serverSitNum){
		if(!this.curGameRoom){
			return;
		}
		this.curGameRoom.updatePlayerState(serverSitNum, 1);		
		if(h1global.curUIMgr.gameroomprepare_ui && h1global.curUIMgr.gameroomprepare_ui.is_show){
			h1global.curUIMgr.gameroomprepare_ui.update_player_state(serverSitNum, 1);			
		}
	},

	postMultiOperation : function(idx_list, aid_list, tile_list){
		// 用于特殊处理多个人同时胡牌的情况
		if (h1global.curUIMgr.gameRoomUIIsShow && h1global.curUIMgr.gameRoomUIIsShow()) {
			for(var i = 0; i < idx_list.length; i++){
				h1global.curUIMgr.roomLayoutMgr.notifyObserver(const_val.GAME_ROOM_UI_NAME, "playOperationEffect", const_val.OP_KONG_WIN, idx_list[i]);
			}
		}
		// if(this.curGameRoom.playerInfoList[serverSitNum]["sex"] == 1){
		// 	cc.audioEngine.playEffect("res/sound/voice/male/sound_man_win.mp3");
		// } else {
		cc.audioEngine.playEffect("res/sound/voice/female/sound_woman_win.mp3");
		// }
	},

    removeHandTile: function (serverSitNum, tileNum, count , sort) {
        sort = sort || this.runMode === const_val.GAME_ROOM_PLAYBACK_MODE;
        if (this.runMode === const_val.GAME_ROOM_PLAYBACK_MODE || serverSitNum == this.serverSitNum) {
            var index = -1;
            for (var i = 0; i < count; i++) {
                index = this.curGameRoom.handTilesList[serverSitNum].indexOf(tileNum);
                if (index >= 0) {
                    this.curGameRoom.handTilesList[serverSitNum].splice(index, 1)
                }
            }
            index = undefined;
        } else {
			this.curGameRoom.handTilesList[serverSitNum].splice(0, count);
        }
        if(sort){
            cutil.tileSort(this.curGameRoom.handTilesList[serverSitNum], this.curGameRoom.kingTiles)
        }
    },
	
	postOperation : function(serverSitNum, aid, tileList, curround_score, curScoreList) {
		cc.log("postOperation: ", serverSitNum, aid, tileList, curround_score, curScoreList);
		if(!this.curGameRoom){
			return;
		}
        if (aid == const_val.OP_PASS) {
            if (h1global.curUIMgr && h1global.curUIMgr.gameRoomUIIsShow && h1global.curUIMgr.gameRoomUIIsShow()) {
                this.curGameRoom.deskPokerList[serverSitNum] = [];
                cc.log("不出！");
                // if (this.curGameRoom.playerInfoList[serverSitNum]["sex"] == 1) {
                //     var soundIdx = cutil.randomContainBorder(1,2)
                //     cc.audioEngine.playEffect("sk/res/sound/voice/ThrowCards/Male/pass" + soundIdx.toString() + ".mp3");
                // } else{
                //     var soundIdx = cutil.randomContainBorder(1,2)
                //     cc.audioEngine.playEffect("sk/res/sound/voice/ThrowCards/Female/pass" + soundIdx.toString() + ".mp3");
                // }
            }
        } else if (aid == const_val.OP_DISCARD) {
            this.curGameRoom.deskPokerList[serverSitNum] = tileList;
            var score = cutil.getBombScore(tileList);
            if (score > 0) {
                this.curGameRoom.curPrizeList[serverSitNum] += score / 30;
            }
            // var cardsType = cutil.getNormalCardsType(cutil.rightShiftCards(tileList))
            if (serverSitNum == this.serverSitNum) {
                if (h1global.curUIMgr && h1global.curUIMgr.gameRoomUIIsShow && h1global.curUIMgr.gameRoomUIIsShow()){
                    h1global.curUIMgr.roomLayoutMgr.notifyObserver(const_val.GAME_ROOM_UI_NAME, "update_player_hand_tiles");
                }
                cc.log("玩家:"+String(serverSitNum)+"出牌:"+String(tileList)+"剩余:"+String(this.curGameRoom.playerPokerList[serverSitNum]));
            } else {
                if (this.curGameRoom.playerPokerList[this.serverSitNum].length <= 0 && (this.serverSitNum + 2)%4 == serverSitNum) {
                    for (var i = 0; i < tileList.length; i++) {
                        var index = this.curGameRoom.playerPokerList[serverSitNum].indexOf(tileList[i]);
                        if (index >= 0) {
                            this.curGameRoom.playerPokerList[serverSitNum].splice(index, 1);
                        }
                    }
                    if (h1global.curUIMgr && h1global.curUIMgr.gameRoomUIIsShow && h1global.curUIMgr.gameRoomUIIsShow()) {
                        // h1global.curUIMgr.roomLayoutMgr.notifyObserver(const_val.GAME_ROOM_UI_NAME, "update_player_discard_tiles", this.server2CurSitNum(this.serverSitNum), this.curGameRoom.deskPokerList[serverSitNum]);
                        // h1global.curUIMgr.gameroom3d_ui.update_cooperation_hand_card_panel(this.curGameRoom.playerPokerList[serverSitNum])
                    }
                }else{
                    this.curGameRoom.playerPokerList[serverSitNum].splice(0, tileList.length)
                }
                cc.log("玩家:"+String(serverSitNum)+"出牌:"+String(tileList));
            }
            this.curGameRoom.controllerIdx = serverSitNum;
            this.curGameRoom.controller_discard_list = tileList;
        } else if (aid >= const_val.OP_WIN_ONE) {
            // this.curGameRoom.deskPokerList[serverSitNum] = [];
            if (h1global.curUIMgr && h1global.curUIMgr.gameRoomUIIsShow && h1global.curUIMgr.gameRoomUIIsShow()) {
                //更新玩家状态，胜利者加标志
                cc.log("玩家:" + serverSitNum + "胜利aid:" + aid);
                this.countNum = -1;
                this.curGameRoom.win_list[aid - 100] = serverSitNum;
                h1global.curUIMgr.roomLayoutMgr.notifyObserver(const_val.GAME_ROOM_UI_NAME, "update_win_player");
            }
        }

        this.countNum++;
        if (h1global.curUIMgr && h1global.curUIMgr.gameRoomUIIsShow && h1global.curUIMgr.gameRoomUIIsShow()) {
            if (this.countNum === this.curGameRoom.player_num - this.curGameRoom.win_list.length) {
                this.countNum = -1;
                for (var j in this.curGameRoom.win_list) {
                    this.curGameRoom.deskPokerList[this.curGameRoom.win_list[j]] = [];
                }
            }
            this.curGameRoom.curround_score = curround_score;
            h1global.curUIMgr.roomLayoutMgr.notifyObserver(const_val.GAME_ROOM_UI_NAME, "update_curscore_panel");
            this.curGameRoom.curScoreList = curScoreList;
            cc.log("本轮分数:", this.curGameRoom.curround_score);
            for (var i = 0 ; i < 4 ; i ++) {
                h1global.curUIMgr.roomLayoutMgr.notifyObserver(const_val.GAME_ROOM_UI_NAME, "update_curscore_curprize_panel", i);
                var idx = this.server2CurSitNum(i);
                h1global.curUIMgr.roomLayoutMgr.notifyObserver(const_val.GAME_ROOM_UI_NAME, "update_player_discard_tiles", idx, this.curGameRoom.deskPokerList[i]);
            }
            h1global.curUIMgr.roomLayoutMgr.notifyObserver(const_val.GAME_ROOM_UI_NAME, "update_not_discard_panel", serverSitNum, aid);
            h1global.curUIMgr.roomLayoutMgr.notifyObserver(const_val.GAME_ROOM_UI_NAME, "playOperationEffect", aid, serverSitNum, tileList);
        }
	},

	selfPostOperation : function(aid, tiles){
		cc.log("selfPostOperation", aid, tiles);
		// 由于自己打的牌自己不需要经服务器广播给自己，因而只要在doOperation时，自己postOperation给自己
		// 而doOperation和postOperation的参数不同，这里讲doOperation的参数改为postOperation的参数
		// var tileList = tiles.slice(0);
		if(aid == const_val.OP_PASS){

		} else if(aid == const_val.OP_DISCARD) {

		}
		// 用于转换doOperation到postOperation的参数
		this.postOperation(this.serverSitNum, aid, tiles, cutil.getDiscardScore(tiles));
	},

	doOperation : function(aid, tileList){
		cc.log("doOperation: ", aid, tileList);
        if(!this.curGameRoom){
            return;
        }
        for (var i = 0; i < tileList.length; i++) {
            var index = this.curGameRoom.playerPokerList[this.serverSitNum].indexOf(tileList[i]);
            this.curGameRoom.playerPokerList[this.serverSitNum].splice(index, 1);
        }
        // 自己的操作直接本地执行，不需要广播给自己
        // this.selfPostOperation(aid, tileList);   //这里由服务端广播
        this.baseCall("doOperation", aid, tileList);
	},

	doOperationFailed : function(err){
		cc.log("doOperationFailed: " + err.toString());
	},

	confirmOperation : function(aid, tileList){
		cc.log("confirmOperation: ", aid, tileList)
		if(!this.curGameRoom){
			return;
		}
		this.curGameRoom.waitAidList = [];
        if (h1global.curUIMgr.gameRoomUIIsShow && h1global.curUIMgr.gameRoomUIIsShow()) {
			h1global.curUIMgr.roomLayoutMgr.notifyObserver(const_val.GAME_ROOM_UI_NAME, "lock_player_hand_tiles");
		}
		// 自己的操作直接本地执行，不需要广播给自己
		// this.selfPostOperation(aid, tileList);
		this.baseCall("confirmOperation", aid, tileList);
	},

	showWaitOperationTime : function(){
        if (onhookMgr && const_val.FAKE_COUNTDOWN > 0) {
            onhookMgr.setWaitLeftTime(const_val.FAKE_COUNTDOWN);
        }
	},

	waitForOperation : function(waitIdx, aid, round_start){
        cc.log("waitForOperation",waitIdx, aid, round_start);
        if(!this.curGameRoom){
            return;
        }
        this.curGameRoom.waitIdx = waitIdx;
        this.curGameRoom.deskPokerList[waitIdx] = [];
        if(aid == const_val.OP_DISCARD){
            if (h1global.curUIMgr.gameRoomUIIsShow &&h1global.curUIMgr.gameRoomUIIsShow()) {
                this.showWaitOperationTime();
                h1global.curUIMgr.roomLayoutMgr.notifyObserver(const_val.GAME_ROOM_UI_NAME, "show_cur_idx_frame", this.curGameRoom.waitIdx);//显示黄框
                h1global.curUIMgr.roomLayoutMgr.notifyObserver(const_val.GAME_ROOM_UI_NAME, "update_not_discard_panel", this.curGameRoom.waitIdx, const_val.OP_DISCARD);//显示不出
                if (waitIdx == this.serverSitNum) {
                    cc.log("this.serverSitNumserverSitNumserverSitNumserverSitNumserverSitNumserverSitNumserverSitNum:",this.serverSitNum);
                    if (round_start) {
                        this.curGameRoom.controllerIdx = waitIdx;
                        this.curGameRoom.controller_discard_list = [];
                        // this.curGameRoom.curround_score = 0;
                        // h1global.curUIMgr.roomLayoutMgr.notifyObserver(const_val.GAME_ROOM_UI_NAME, "update_curscore_panel");
                    }
                    this.getTipsCards();
                    this.tips_idx = -1;
                    if (this.tipsList.length == 0 && !round_start && this.curGameRoom.playerPokerList[waitIdx].length > 0) {
                        h1global.curUIMgr.roomLayoutMgr.notifyObserver(const_val.GAME_ROOM_UI_NAME, "update_no_big_panel", waitIdx);
                    } else {
                        h1global.curUIMgr.roomLayoutMgr.notifyObserver(const_val.GAME_ROOM_UI_NAME, "update_operation_panel", true);
                    }
                }
                h1global.curUIMgr.roomLayoutMgr.notifyObserver(const_val.GAME_ROOM_UI_NAME, "update_player_discard_tiles", this.server2CurSitNum(waitIdx), []);
                // h1global.curUIMgr.gameroom_ui.update_discard_card_panel(this.server2CurSitNum(waitIdx), []);
                // h1global.curUIMgr.gameroom_ui.update_discard_card_panel(this.server2CurSitNum((this.curGameRoom.controllerIdx +1) % 4), []);
            }
        }
	},

	roundResult : function(roundRoomInfo){
		if(!this.curGameRoom){
			return;
		}
		cc.log("roundResult")
		cc.log(roundRoomInfo)
		this.curGameRoom.endGame();
		var playerInfoList = roundRoomInfo["player_info_list"];
		for(var i = 0; i < playerInfoList.length; i++){
			this.curGameRoom.playerInfoList[i]["score"] = playerInfoList[i]["score"];
			this.curGameRoom.playerInfoList[i]["total_score"] = playerInfoList[i]["total_score"];
		}
		var anim_end_num = 0;
        var self = this;

        // Note: 此处只在回放上
        var replay_func = undefined;
        if(self.runMode === const_val.GAME_ROOM_PLAYBACK_MODE){
            replay_func = arguments[1];
		}

        let player = h1global.entityManager.player();
        var curGameRoom = player.curGameRoom;
        var serverSitNum = player.serverSitNum;

		function callbackfunc(){
            if (h1global.curUIMgr.settlement_ui) {
                h1global.curUIMgr.settlement_ui.show_by_info(roundRoomInfo, serverSitNum, curGameRoom);
            }
            if (self.runMode === const_val.GAME_ROOM_PLAYBACK_MODE) {
                h1global.curUIMgr.settlement_ui.show_by_info(roundRoomInfo, serverSitNum, curGameRoom, undefined, replay_func);
            } else {
                if (h1global.curUIMgr.settlement_ui) {
                    h1global.curUIMgr.settlement_ui.show_by_info(roundRoomInfo, serverSitNum, curGameRoom);
                }
            }
		}

		if (h1global.curUIMgr.gameRoomUIIsShow && h1global.curUIMgr.gameRoomUIIsShow()) {
			// h1global.curUIMgr.roomLayoutMgr.notifyObserver(const_val.GAME_ROOM_UI_NAME, "play_result_anim", playerInfoList);
			// h1global.curUIMgr.roomLayoutMgr.notifyObserver(const_val.GAME_ROOM_UI_NAME, "play_luckytiles_anim", roundRoomInfo["lucky_tiles"], function(){
			// 	anim_end_num += 1;
			// 	callbackfunc()
			// });
			var func = function () {
				// h1global.curUIMgr.roomLayoutMgr.notifyObserver("play_result_anim", playerInfoList);
				// h1global.curUIMgr.roomLayoutMgr.notifyObserver("play_luckytiles_anim", roundRoomInfo["lucky_tiles"], function () {
				// 	anim_end_num += 1;
					callbackfunc()
				// });
			};
			if (h1global.curUIMgr.gameRoomUIIsShow()) {
				func();
			} else {
				h1global.curUIMgr.roomLayoutMgr.registerShowObserver(func)
			}
		} else {
			callbackfunc()
		}
	},

	finalResult : function(finalPlayerInfoList, roundRoomInfo){
		if(!this.curGameRoom){
			return;
		}

		onhookMgr.setApplyCloseLeftTime(null);
        // Note: 为了断线重连后继续停留在总结算上，此处设置一个标志位作为判断
        if(h1global.curUIMgr.result_ui) {
            h1global.curUIMgr.result_ui.finalResultFlag = true;
        }

        var anim_end_num = 0;
        let player = h1global.entityManager.player();
        var curGameRoom = player.curGameRoom;
        var serverSitNum = player.serverSitNum;
		function callbackfunc(){
			if (h1global.curUIMgr.settlement_ui) {
                h1global.curUIMgr.settlement_ui.show_by_info(roundRoomInfo, serverSitNum, curGameRoom, function () {
					if(h1global.curUIMgr.result_ui){
                        h1global.curUIMgr.result_ui.show_by_info(finalPlayerInfoList, curGameRoom);
					}
				});
			}
		}

		// if (h1global.curUIMgr.gameRoomUIIsShow &&h1global.curUIMgr.gameRoomUIIsShow()) {
            // h1global.curUIMgr.roomLayoutMgr.notifyObserver(const_val.GAME_ROOM_UI_NAME, "play_result_anim", roundRoomInfo["player_info_list"]);
			// h1global.curUIMgr.roomLayoutMgr.notifyObserver(const_val.GAME_ROOM_UI_NAME, "play_luckytiles_anim", roundRoomInfo["lucky_tiles"], function(){
			// 	anim_end_num += 1;
			// 	callbackfunc()
			// });
		// }
		if(h1global.curUIMgr.gameRoomUIIsShow &&h1global.curUIMgr.gameRoomUIIsShow()) {
			var func = function () {
				// h1global.curUIMgr.roomLayoutMgr.notifyObserver("play_result_anim", roundRoomInfo["player_info_list"]);
				// h1global.curUIMgr.roomLayoutMgr.notifyObserver("play_luckytiles_anim", roundRoomInfo["lucky_tiles"], function(){
				// 	anim_end_num += 1;
					callbackfunc()
				// });
			};
			if (h1global.curUIMgr.gameRoomUIIsShow()) {
				func();
			} else {
				h1global.curUIMgr.roomLayoutMgr.registerShowObserver(func)
			}
		} else {
			callbackfunc()
		}
	},

    subtotalResult:function (finalPlayerInfoList) {
        if(!this.curGameRoom){
            return;
        }
        if (onhookMgr) {
            onhookMgr.setApplyCloseLeftTime(null);
        }

		if(h1global.curUIMgr.applyclose_ui && h1global.curUIMgr.applyclose_ui.is_show){
            h1global.curUIMgr.applyclose_ui.hide()
		}
        if (h1global.curUIMgr.settlement_ui && h1global.curUIMgr.settlement_ui.is_show) {
            h1global.curUIMgr.settlement_ui.hide()
        }
        // Note: 为了断线重连后继续停留在总结算上，此处设置一个标志位作为判断
        if(h1global.curUIMgr.result_ui) {
            h1global.curUIMgr.result_ui.finalResultFlag = true;
        }
        let player = h1global.entityManager.player();
        var curGameRoom = player.curGameRoom;
        if (h1global.curUIMgr.result_ui) {
            h1global.curUIMgr.result_ui.show_by_info(finalPlayerInfoList, curGameRoom);
        }
    },

	prepare:function(){
		if(!this.curGameRoom){
			return;
		}
		this.baseCall("prepare");
	},
	
	notifyPlayerOnlineStatus:function(serverSitNum, status){
		if(!this.curGameRoom){
			return;
		}
		this.curGameRoom.updatePlayerOnlineState(serverSitNum, status);
		if (h1global.curUIMgr.gameRoomUIIsShow && h1global.curUIMgr.gameRoomUIIsShow()) {
			h1global.curUIMgr.roomLayoutMgr.notifyObserver(const_val.GAME_ROOM_UI_NAME, "update_player_online_state", serverSitNum, status);
		}
	},
});
