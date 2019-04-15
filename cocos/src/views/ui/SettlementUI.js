"use strict"
var SettlementUI = UIBase.extend({
	ctor:function() {
		this._super();
		this.resourceFilename = "res/ui/SettlementUI.json";
		this.setLocalZOrder(const_val.SettlementZOrder)
	},
	initUI:function(){
		var self = this;
		var confirm_btn = this.rootUINode.getChildByName("confirm_btn");
		function confirm_btn_event(sender, eventType){
			if(eventType == ccui.Widget.TOUCH_ENDED){
				// TEST:
				// self.hide();
				// h1global.curUIMgr.gameroomprepare_ui.show_prepare();
				// h1global.curUIMgr.notifyObserver("hide");
				// return;
				self.hide();

				//重新开局
                var player = h1global.entityManager.player();
                if (player) {
                    player.curGameRoom.updatePlayerState(player.serverSitNum, 1);
                    h1global.curUIMgr.gameroomprepare_ui.show_prepare();
                    h1global.curUIMgr.roomLayoutMgr.notifyObserver(const_val.GAME_ROOM_UI_NAME, "hide");
                    player.prepare();
                } else {
                    cc.warn('player undefined');
                }
			}
		}
		confirm_btn.addTouchEventListener(confirm_btn_event);
		this.kongTilesList = [[], [], [], []];

        //单局结算分享
        this.rootUINode.getChildByName("share_btn").addTouchEventListener(function(sender, eventType){
            if(eventType == ccui.Widget.TOUCH_ENDED){
                if((cc.sys.os == cc.sys.OS_ANDROID && cc.sys.isNative)){
                    jsb.fileUtils.captureScreen("", "screenShot.png");
                } else if((cc.sys.os == cc.sys.OS_IOS && cc.sys.isNative)){
                    jsb.reflection.callStaticMethod("WechatOcBridge","takeScreenShot");
                } else {
                    h1global.curUIMgr.share_ui.show();
                }
            }
        });

        if ((cc.sys.os == cc.sys.OS_IOS && cc.sys.isNative) && switches.appstore_check == true) {
            this.rootUINode.getChildByName("share_btn").setVisible(false);
        }
	},

	setPlaybackLayout:function (replay_btn_func) {
        let replay_btn = ccui.helper.seekWidgetByName(this.rootUINode, "replay_btn");
        let self = this;
        replay_btn.addTouchEventListener(function (sender,eventType) {
            if(eventType === ccui.Widget.TOUCH_ENDED){
                if (replay_btn_func) replay_btn_func();
                if(self.is_show){
	                self.hide();
				}
            }
        });
        replay_btn.setVisible(true);
        let back_hall_btn = ccui.helper.seekWidgetByName(this.rootUINode, "back_hall_btn");
        back_hall_btn.addTouchEventListener(function (sender,eventType) {
			if(eventType === ccui.Widget.TOUCH_ENDED){
				h1global.runScene(new GameHallScene());
			}
        });
        back_hall_btn.setVisible(true);

        ccui.helper.seekWidgetByName(this.rootUINode, "share_btn").setVisible(false);
        ccui.helper.seekWidgetByName(this.rootUINode, "confirm_btn").setVisible(false);
    },

    show_by_info: function (roundRoomInfo, serverSitNum, curGameRoom, confirm_btn_func, replay_btn_func) {
		cc.log("结算==========>:");
		cc.log("roundRoomInfo :  ",roundRoomInfo);
		var self = this;
		this.show(function(){
			self.player_tiles_panels = [];
			self.player_tiles_panels.push(self.rootUINode.getChildByName("settlement_panel").getChildByName("victory_item_panel1"));
			self.player_tiles_panels.push(self.rootUINode.getChildByName("settlement_panel").getChildByName("victory_item_panel2"));
			self.player_tiles_panels.push(self.rootUINode.getChildByName("settlement_panel").getChildByName("victory_item_panel3"));
			self.player_tiles_panels.push(self.rootUINode.getChildByName("settlement_panel").getChildByName("victory_item_panel4"));	
			var playerInfoList = roundRoomInfo["player_info_list"];
			// 需求 将玩家自己放在第一位
			// var left = [];
			// var right = [];
			// for(let i=0; i<playerInfoList.length; i++){
			// 	if (playerInfoList[i]["idx"] < serverSitNum){
             //        left.push(playerInfoList[i])
			// 	}else{
			// 		right.push(playerInfoList[i])
			// 	}
			// }
            // playerInfoList = right.concat(left);
			for(var i = 0; i < 4; i++){
				var roundPlayerInfo = playerInfoList[i];
				var server_seat_num = roundPlayerInfo["idx"];
				if (!roundPlayerInfo) {
					self.player_tiles_panels[i].setVisible(false);
					continue;
				}
				self.player_tiles_panels[i].setVisible(true);
                self.update_score(i, roundPlayerInfo["score"], roundRoomInfo["curScoreList"][i], roundRoomInfo["lastScoreList"][i], roundRoomInfo["prizeScoreList"][i]);  //显示分数
                // self.update_base_score(i, server_seat_num, roundRoomInfo["win_idx"], h1global.entityManager.player().curGameRoom.base_score); //底分
                // self.update_mul(i, server_seat_num, roundRoomInfo["win_idx"], roundRoomInfo["multiply"]); //倍数
                self.update_player_hand_tiles(i, server_seat_num, curGameRoom, roundPlayerInfo["tiles"], roundRoomInfo["win_list"]);   //显示麻将
                // self.update_player_up_tiles(i, server_seat_num, curGameRoom);
                self.update_player_info(i, server_seat_num, curGameRoom);  //idx 表示玩家的座位号
                // self.update_player_win(i, server_seat_num, roundRoomInfo["win_idx"], roundRoomInfo["from_idx"], roundRoomInfo["dealer_idx"], roundRoomInfo["cur_dealer_mul"], roundRoomInfo["result_list"], roundRoomInfo["job_relation"]);
			}
            self.show_title(playerInfoList[h1global.entityManager.player().serverSitNum]["score"]);
            var confirm_btn = self.rootUINode.getChildByName("confirm_btn");
            var result_btn = self.rootUINode.getChildByName("result_btn");
			if(confirm_btn_func){
				self.rootUINode.getChildByName("result_btn").addTouchEventListener(function(sender, eventType) {
					if(eventType ==ccui.Widget.TOUCH_ENDED){
						self.hide();
						confirm_btn_func();
					}
				});
                confirm_btn.setVisible(false);
                result_btn.setVisible(true);
			} else if (replay_btn_func) {
                self.setPlaybackLayout(replay_btn_func);
			} else {
                confirm_btn.setVisible(true);
                result_btn.setVisible(false);
			}
		});
	},

    show_title: function (score) {
        var bg_img = this.rootUINode.getChildByName("settlement_panel").getChildByName("bg_img");
        var title_img = this.rootUINode.getChildByName("settlement_panel").getChildByName("title_img");
        title_img.ignoreContentAdaptWithSize(true);
        if (score > 0) {
            //胜利
            bg_img.loadTexture("res/ui/BackGround/settlement_win.png");
            title_img.loadTexture("res/ui/SettlementUI/win_title.png");
        } else {
            bg_img.loadTexture("res/ui/BackGround/settlement_fail.png");
            title_img.loadTexture("res/ui/SettlementUI/fail_title.png");
        }
	},

	update_player_hand_tiles:function(panel_idx, serverSitNum, curGameRoom ,cardList, win_list){
		if(!this.is_show) {return;}
		var cur_player_card_panel = this.player_tiles_panels[panel_idx].getChildByName("item_hand_panel");
		var rank_img = this.player_tiles_panels[panel_idx].getChildByName("rank_img");
		if(!cur_player_card_panel || !rank_img){
			return;
		}
        cardList = cutil.cardSort(cardList);
		if (win_list.indexOf(serverSitNum) < 0) {
            rank_img.setVisible(false);
            for (var i = 0; i < 22; i++) {
                var card_img = cur_player_card_panel.getChildByName("card_img_" + i.toString());
                card_img.stopAllActions();
                if (cardList[i]) {
                    card_img.ignoreContentAdaptWithSize(true);
                    card_img.loadTexture("Card/Card_" + cardList[i].toString() + ".png", ccui.Widget.PLIST_TEXTURE);
                    card_img.setVisible(true);
                } else {
                    card_img.setVisible(false);
                }
            }
		} else {
            cur_player_card_panel.setVisible(false);
            var rank = win_list.indexOf(serverSitNum);
            rank_img.loadTexture("res/ui/SettlementUI/" + const_val.RANK_LIST[rank] + ".png");
		}
	},

    update_player_info: function (panel_idx, serverSitNum, curGameRoom) {
		if(!this.is_show) {return;}
		var cur_player_info_panel = this.player_tiles_panels[panel_idx];
		if(!cur_player_info_panel){
			return;
		}
        var playerInfo = curGameRoom.playerInfoList[serverSitNum];
        cur_player_info_panel.getChildByName("owner_img").setVisible(playerInfo["is_creator"])
		cur_player_info_panel.getChildByName("item_name_label").setString(playerInfo["nickname"]);
		cur_player_info_panel.getChildByName("item_id_label").setString("ID:" + playerInfo["userId"].toString());
		cutil.loadPortraitTexture(playerInfo["head_icon"], playerInfo["sex"], function (img) {
			if (cur_player_info_panel.getChildByName("item_avatar_img")) {
				cur_player_info_panel.getChildByName("item_avatar_img").removeFromParent();
			}
			var portrait_sprite  = new cc.Sprite(img);
			portrait_sprite.setName("portrait_sprite");
			portrait_sprite.setScale(78 / portrait_sprite.getContentSize().width);
            portrait_sprite.x = 70;
            portrait_sprite.y = 55;
			cur_player_info_panel.addChild(portrait_sprite);
			portrait_sprite.setLocalZOrder(-1);
		});
	},

	update_score:function(panel_idx, score, grab_score, last_score, prize_score) {
		var score_label = this.player_tiles_panels[panel_idx].getChildByName("item_score_label");
		var grab_score_label = this.player_tiles_panels[panel_idx].getChildByName("grab_score_label");
		var last_score_label = this.player_tiles_panels[panel_idx].getChildByName("last_score_label");
		var prize_score_label = this.player_tiles_panels[panel_idx].getChildByName("prize_score_label");
        grab_score_label.setString(grab_score.toString());
        last_score_label.setString(last_score.toString());
        prize_score_label.setString(prize_score.toString());
		if(score >= 0){
			score_label.setTextColor(cc.color(235, 235, 13));
			score_label.setString("+" + score.toString());
		} else {
			score_label.setTextColor(cc.color(225, 225, 214));
			score_label.setString(score.toString());
		}
	},
});