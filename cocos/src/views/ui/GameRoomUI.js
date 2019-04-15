// var UIBase = require("src/views/ui/UIBase.js")
// cc.loader.loadJs("src/views/ui/UIBase.js")
"use strict"
var GameRoomUI = UIBase.extend({
	ctor:function() {
		this._super();
		this.talk_img_num = 0;
        this.cardNumLabelList = [];
	},
	initUI:function(){
        var self = this;
		var player = h1global.entityManager.player();
		this.rootUINode.getChildByName("bg_panel").addTouchEventListener(function (sender, eventType) {
			if(eventType === ccui.Widget.TOUCH_ENDED){
                if (h1global.curUIMgr.gameplayerinfo_ui && h1global.curUIMgr.gameplayerinfo_ui.is_show) {
                    h1global.curUIMgr.gameplayerinfo_ui.hide();
                }
                self._resetSelectTile();
			}
        });

		this.beginAnimPlaying = false;
		this.touch_state = const_val.PLAYER_TOUCH_SELF_STATE
		this.isNeedDiscard = true;
        this.curSelectTile = undefined;
        this.choose_tile_list = [];
        this.prepareCards = [];
        this.game_info_panel = this.rootUINode.getChildByName("game_info_panel");
        this.game_info_panel.setVisible(true);
        for (var i = 0 ; i < 4 ; i ++) {
        	this.game_info_panel.getChildByName("player_discard_panel" + i.toString()).setVisible(false);
		}

		this.init_player_info_panel();
		this.init_player_tile_panel();
        this.init_operation_panel();

		h1global.curUIMgr.gameroominfo_ui.show();

		this.update_roominfo_panel();

		// TEST
		// this.play_luckytiles_anim([11, 12, 13]);
		// this.playOperationEffect(const_val.OP_PONG);
		// this.startBeginAnim();
		if(!cc.audioEngine.isMusicPlaying()){
            cc.audioEngine.resumeMusic();
        }

        if (player.curGameRoom.player_num == 3) {
        	this.rootUINode.getChildByName("player_info_panel2").setVisible(false);
        	this.rootUINode.getChildByName("player_tile_panel2").setVisible(false);
        	this.rootUINode.getChildByName("wreath_panel2").setVisible(false);

        	this.rootUINode.getChildByName("game_info_panel").getChildByName("player_discard_panel2").setVisible(false);
        }

        if (h1global.curUIMgr.gameplayerinfo_ui && h1global.curUIMgr.gameplayerinfo_ui.is_show) {
            h1global.curUIMgr.gameplayerinfo_ui.hide();
		}

        function touch_event(sender, eventType){
            if (eventType === ccui.Widget.TOUCH_ENDED) {
                if (h1global.curUIMgr.gameplayerinfo_ui && h1global.curUIMgr.gameplayerinfo_ui.is_show) {
                    h1global.curUIMgr.gameplayerinfo_ui.hide();
                }
                self._resetPrepareCards();
            }
        }
        this.rootUINode.getChildByName("bg_panel").addTouchEventListener(touch_event);

        var selfCards = player.curGameRoom.playerPokerList[player.serverSitNum];
        if (player.curGameRoom.waitIdx == player.serverSitNum) {
            player.getTipsCards();
            player.tips_idx = -1;
            if (player.tipsList.length == 0 && selfCards.length > 0) {
                this.update_no_big_panel(player.serverSitNum);
                var operation_panel = this.rootUINode.getChildByName("operation_panel");
                operation_panel.setVisible(false);
            }
        }


        cutil.tileSort(selfCards);
        selfCards.sort(function(a, b){return a-b;});
        player.curGameRoom.playerPokerList[player.serverSitNum] = cutil.cardSort(selfCards);

        for (var i = 0 ; i < 4 ; i ++) {
        	var idx = player.server2CurSitNum(i);
        	this.update_curscore_curprize_panel(i);
        	if (i == player.curGameRoom.waitIdx) {
                this.update_player_discard_tiles(idx, []);
            } else {
                this.update_player_discard_tiles(idx, player.curGameRoom.deskPokerList[i]);
			}
        }

        this.show_cur_idx_frame(player.curGameRoom.waitIdx);
		this.update_player_hand_tiles();
		this.update_curscore_panel();
		this.update_win_player();
	},

	update_wait_time_left:function(leftTime) {
        var player = h1global.entityManager.player();
        if (!player || !player.curGameRoom) {
            return;
        }
		leftTime = Math.floor(leftTime);
        for (var i = 0 ; i < 4 ; i ++) {
            var idx = player.server2CurSitNum(i);
            var cur_player_info_panel = this.rootUINode.getChildByName("player_info_panel" + idx.toString());
            var countdown_img = cur_player_info_panel.getChildByName("countdown_img");
            var countdown_label = countdown_img.getChildByName("countdown_label");
            if (i == player.curGameRoom.waitIdx) {
                countdown_label.setString(leftTime.toString());
                countdown_label.ignoreContentAdaptWithSize(true);
                countdown_label.setVisible(true);
                countdown_img.setVisible(true);
            } else {
                countdown_label.setVisible(false);
                countdown_img.setVisible(false);
            }
        }
        // if(leftTime < 5){
		// 	this.show_discard_tips()
		// }
	},

	init_player_info_panel:function(){
		var player = h1global.entityManager.player();
		var curGameRoom = h1global.entityManager.player().curGameRoom;
		for(var i = 0; i < player.curGameRoom.player_num; i++){
			this.update_player_info_panel(i, curGameRoom.playerInfoList[i]);
			this.update_player_online_state(i, curGameRoom.playerInfoList[i]["online"]);
		}
	},

	update_player_info_panel:function(serverSitNum, playerInfo){
		if(serverSitNum < 0 || serverSitNum > 3){
			return;
		}
		var player = h1global.entityManager.player();
		var idx = player.server2CurSitNum(serverSitNum);
		if(!this.is_show) {return;}
		var cur_player_info_panel = this.rootUINode.getChildByName("player_info_panel" + idx.toString());
		if(!playerInfo){
			cur_player_info_panel.setVisible(false);
			return;
		}
		var name_label = ccui.helper.seekWidgetByName(cur_player_info_panel, "name_label");
		var nickname = playerInfo["nickname"];
		nickname =  cutil.info_sub(nickname , 4);
		name_label.setString(nickname);
		var frame_img = ccui.helper.seekWidgetByName(cur_player_info_panel, "frame_img");
		cur_player_info_panel.reorderChild(frame_img, 1);
		frame_img.setTouchEnabled(true);

		frame_img.addTouchEventListener(function(sender, eventType){
			if(eventType == ccui.Widget.TOUCH_ENDED){
				h1global.curUIMgr.gameplayerinfo_ui.show_by_info(playerInfo,serverSitNum);
			}
		});
		var dealer_img = ccui.helper.seekWidgetByName(cur_player_info_panel, "dealer_img");
		cur_player_info_panel.reorderChild(dealer_img, 2);
		var self = this;
		cutil.loadPortraitTexture(playerInfo["head_icon"], playerInfo["sex"], function(img){
			if(self.is_show && cur_player_info_panel){
				if (cur_player_info_panel.getChildByName("portrait_sprite")) {
                    cur_player_info_panel.getChildByName("portrait_sprite").removeFromParent();
                }
				var portrait_sprite  = new cc.Sprite(img);
				portrait_sprite.setName("portrait_sprite");
				portrait_sprite.setScale(74/portrait_sprite.getContentSize().width);
				portrait_sprite.x = cur_player_info_panel.getContentSize().width * 0.5;
				portrait_sprite.y = cur_player_info_panel.getContentSize().height * 0.5;
				portrait_sprite.setLocalZOrder(-1);
				cur_player_info_panel.addChild(portrait_sprite);
			}
		});

		var score_label = ccui.helper.seekWidgetByName(cur_player_info_panel, "score_label");
		score_label.ignoreContentAdaptWithSize(true);
		score_label.setString((playerInfo["total_score"] == undefined ? 0 : playerInfo["total_score"]).toString());
		var dealer_img = ccui.helper.seekWidgetByName(cur_player_info_panel, "dealer_img");
		dealer_img.setVisible(player.curGameRoom.dealerIdx == serverSitNum);
		if(player.curGameRoom.dealerIdx === serverSitNum){
            dealer_img.loadTexture("res/ui/Default/common_dealer_img.png");
		}
		if(player.startActions["GameRoomUI"]){
            dealer_img.setScale(5);
            dealer_img.runAction(cc.Sequence.create(
                cc.ScaleTo.create(0.5,1),
                cc.CallFunc.create(function () {
                    dealer_img.setScale(1);
                })
            ));
        }

		var owner_img = ccui.helper.seekWidgetByName(cur_player_info_panel, "owner_img");
		cur_player_info_panel.reorderChild(owner_img, 3);
		owner_img.setVisible(player.curGameRoom.playerInfoList[serverSitNum].is_creator);
		cur_player_info_panel.setVisible(true);
        cur_player_info_panel.getChildByName("countdown_img").setVisible(false);
        cur_player_info_panel.getChildByName("rank_img").setVisible(false);

    },

	update_player_online_state:function(serverSitNum, state){
		if(serverSitNum < 0 || serverSitNum > 3){
			return;
		}
		var player = h1global.entityManager.player();
		var player_info_panel = this.rootUINode.getChildByName("player_info_panel" + player.server2CurSitNum(serverSitNum).toString());
		var state_img = ccui.helper.seekWidgetByName(player_info_panel, "state_img");
		if (state == 0) {
			state_img.loadTexture("res/ui/GameRoomUI/state_offline.png");
			state_img.setVisible(true);
		} else {
			state_img.setVisible(false);
		}
	},

    _resetSelectTile: function () {
        this.choose_tile_list = [];
        if (this.curSelectTile) {
            this.curSelectTile.setPositionY(0);
            this.curSelectTile = undefined;
            this.cancel_mark_same_tiles();
            this.update_canwin_tile_panel(const_val.NOT_DISPLAY_CANWIN_PANEL);
        }
    },

	init_player_tile_panel:function(){
		return;
		var self = this;
		this.kongTilesList = [[], [], [], []];
		this.upTileMarksList = [[], [], [], []];
		this.handTileMarksList = [[], [], [], []];
		this.discardTileMarksList = [[], [], [], []];

		this.moving_tile = undefined;
		var player = h1global.entityManager.player();
		var player_hand_panel = this.rootUINode.getChildByName("player_tile_panel0").getChildByName("player_hand_panel")
		// 14张手牌
		var hand_list = []
        for (var i = 0; i < 14; i++) {
            var tile_img = ccui.helper.seekWidgetByName(player_hand_panel, "tile_img_" + String(i));
            tile_img.index = i;
            hand_list.push(tile_img)
        }
		// 真实手牌
		let handTiles = player.curGameRoom.handTilesList[player.serverSitNum];

		var hand_panel_height = player_hand_panel.getContentSize().height;
		var config = this.getHandTileConfig();

		var idx = player.server2CurSitNum(player.serverSitNum);
        var options = this.get_update_player_hand_tiles_config(idx);
        var offset_x = options.draw.offset.x;

		function choose_tile(tile) {
            if (self.curSelectTile === tile) {
                return;
            }
            var isCanMark = (self.curSelectTile && self.curSelectTile.tileNum !== tile.tileNum) || !self.curSelectTile ? true : false
            if(self.curSelectTile){
                unchoose_tile()
            }
            self.curSelectTile = tile
            self.curSelectTile.setPositionY(config.sel_posy)
			self.update_canwin_tile_panel(self.curSelectTile.tileNum);
            cc.audioEngine.playEffect("res/sound/effect/select_tile.mp3");
            // 游戏场中牌变灰
            if (isCanMark){
                self.mark_same_tiles(tile.tileNum)
			}
        }
        
        function unchoose_tile() {
            self.curSelectTile.setPositionY(0);
            self.curSelectTile.setVisible(true);
            self.curSelectTile = undefined;
            self.cancel_mark_same_tiles();
            self.update_canwin_tile_panel(const_val.NOT_DISPLAY_CANWIN_PANEL);
        }

		this.moving_tile = undefined;
		function addMoving_tile(tile){
			self.moving_tile = tile.clone();
			self.moving_tile.tileNum = tile.tileNum;
			self.moving_tile.setTouchEnabled(false);
			self.moving_tile.setAnchorPoint(cc.p(0.5, 0.5));
			self.rootUINode.addChild(self.moving_tile);
			if(player.curGameRoom && player.curGameRoom.kingTiles.indexOf(tile.tileNum) >= 0){
				self.mark_king_tile(self.moving_tile);
			}
		}

        function discard_tile(tile, discard_pos) {
            let player = h1global.entityManager.player();
            if (player){
                self.lastDiscardPosition = discard_pos !== undefined ? discard_pos : player_hand_panel.convertToWorldSpace(tile.getPosition());
                player.doOperation(const_val.OP_DISCARD, [tile.tileNum]);
                // self.lastDiscardPosition = undefined
                reset_tile()
            } else { //断线
                reset_tile()
			}
        }

        function add_choose_list(tile) {
            if (self.choose_tile_list.length >= 2){
                self.choose_tile_list.splice(0, 1)
            }
            self.choose_tile_list.push(tile)
        }
        
        function reset_tile() { // 出牌之后 等还原 操作
			if (self.curSelectTile){
                unchoose_tile()
			}
            if (self.moving_tile) {
                self.moving_tile.removeFromParent()
                self.moving_tile = undefined
            }
            self.choose_tile_list = []
        }

		// 面板上的牌event
        function hand_tile_event(tile, touch_mode){
            if (self.moving_tile) {return}
            if (self.touch_state === const_val.PLAYER_TOUCH_SELF_STATE && !player.canDiscardIdx(tile.index)){ //别人打财神后 限制出牌
            	return
			}
			if(touch_mode == ccui.Widget.TOUCH_BEGAN){ // 只选中
				// 特殊设计 加一个记录touch_began len==2的数组
                add_choose_list(tile)
                choose_tile(tile)
			} else if (touch_mode == ccui.Widget.TOUCH_MOVED){

				// 打出一张牌后 没放开，移动会触发 touch_moved 立牌
				// 左右 move 是建立在touch_began的基础上的 必须有
                choose_tile(tile)
			} else if (touch_mode == ccui.Widget.TOUCH_ENDED) { // 双击打出
                //touch_end的牌和began的不一样 说明是移动后选中的
                if (self.choose_tile_list.length >= 1 && self.choose_tile_list[self.choose_tile_list.length-1].index != tile.index){
                    add_choose_list(tile)
                }
                // cc.log("choose_tile_list", choose_tile_list)
				if(self.touch_state !== const_val.PLAYER_TOUCH_SELF_STATE){ // 非出牌状态不能出牌
					return
				}

				// 第一次 touch_began 基本上会触发 touch_end 操作 此时不能打出
				if(self.choose_tile_list.length == 2 && self.choose_tile_list[0].index == self.choose_tile_list[1].index && self.curSelectTile.index == self.choose_tile_list[0].index){
                    discard_tile(tile)
				}
			}
        }

		function touch_func(touch_pos, eventType){
        	cc.log(handTiles)
			let effective_width = self.touch_state === const_val.PLAYER_TOUCH_SELF_STATE ? config.real_width * handTiles.length + offset_x : config.real_width * handTiles.length
            if (touch_pos.x >= 0 && touch_pos.x < effective_width && touch_pos.y >= 0 && touch_pos.y <= hand_panel_height) {
                var touch_idx = Math.floor(touch_pos.x / config.real_width)
                if (self.touch_state === const_val.PLAYER_TOUCH_SELF_STATE && touch_idx + 1 >= handTiles.length) { //3x+2 最后一张特殊处理
                    touch_idx = handTiles.length - 1
                    // cc.log("======>", touch_idx, config.real_width, offset_x, touch_pos, effective_width)
                    if (touch_idx * config.real_width + offset_x <= touch_pos.x && touch_pos.x < effective_width) {
                        // cc.log("3x+2 最后一张特殊处理", touch_idx, touch_pos)
                        hand_tile_event(hand_list[touch_idx], eventType)
                    }
                } else {
                    // cc.log("select_tile2", touch_idx, eventType)
                    // hand_tile_event(hand_list[touch_idx], eventType)
					// 用户体验调优 向右上方滑动 经过其他牌不选中其他牌
					if (eventType == ccui.Widget.TOUCH_MOVED){
						//角度为标准
                        // let began_p = player_hand_panel.convertToNodeSpace(player_hand_panel.getTouchBeganPosition())
                        // let began_idx = Math.floor(began_p.x / config.real_width)
						// let began_mid_p = cc.p(began_idx * config.real_width + config.real_width/2, config.tile_height/2)
                        //
						// cc.log(began_mid_p.x , touch_pos.x, config.real_width)
						// cc.log(touch_pos, began_mid_p, cutil.angle(began_mid_p, touch_pos))
                        // if (Math.abs(began_mid_p.x - touch_pos.x) <= config.real_width * 0.7){ //从began开始 移动距离 小于某个值的时候 触发这一机制
						// 	if(cutil.angle(began_mid_p, touch_pos) <= 25 || cutil.angle(began_mid_p, touch_pos) >= 155){
                         //        cc.log("1111111111111111111111")
                         //        hand_tile_event(hand_list[touch_idx], eventType)
                         //    } else {
						// 		cc.log("222222222222222222222222")
                         //        var touch_idx = Math.floor(began_mid_p.x / config.real_width)
                         //        hand_tile_event(hand_list[touch_idx], eventType)
						// 	}
                        // } else {
                         //    hand_tile_event(hand_list[touch_idx], eventType)
						// }
						// 圆心距离为标准
                        // let moved_mid_p = cc.p(touch_idx * config.real_width + config.real_width/2, config.tile_height/2)
                        // if (cutil.distance(moved_mid_p, touch_pos) <= config.real_width/2){
                        //     hand_tile_event(hand_list[touch_idx], eventType)
                        // }
						// 矩形为标准
						if (touch_pos.y <= config.bottom_height + config.real_height * 60/100){
                            hand_tile_event(hand_list[touch_idx], eventType)
						}
					} else {
                        hand_tile_event(hand_list[touch_idx], eventType)
					}
                }
            }else{
                if (self.touch_state !== const_val.PLAYER_TOUCH_SELF_STATE && self.curSelectTile) {
                    reset_tile()
                }
			}
        }

		function player_hand_panel_event(sender, eventType){
            // NOTE:下乡禁止触摸和滑动
            if(self.touch_state === const_val.PLAYER_TOUCH_FORCE_STATE){
                if(self.curSelectTile){
                    reset_tile()
                }
                return;
            }
			if (eventType == ccui.Widget.TOUCH_BEGAN) {
				let p = player_hand_panel.convertToNodeSpace(sender.getTouchBeganPosition())
				touch_func(p, eventType)
			} else if (eventType == ccui.Widget.TOUCH_MOVED) {
				let p = player_hand_panel.convertToNodeSpace(sender.getTouchMovePosition())
				touch_func(p, eventType)
				if (self.curSelectTile && !self.moving_tile && self.touch_state === const_val.PLAYER_TOUCH_SELF_STATE && p.y - self.curSelectTile.getPositionY() > 76) { // 向上拖 生成一个 麻将子
					if (player.canDiscardIdx(self.curSelectTile.index)){ // 其他玩家打财神后限制出牌
                        addMoving_tile(self.curSelectTile)
                        self.curSelectTile.setVisible(false)
					}
				} 
				if (self.moving_tile) {
					self.moving_tile.setPosition(self.rootUINode.convertToNodeSpace(player_hand_panel.convertToWorldSpace(p)));
				}
			} else if (eventType == ccui.Widget.TOUCH_CANCELED) {
				if (self.moving_tile) {
                    // 出牌 或者 放弃出牌
                    let py = self.moving_tile.getPositionY()
                    // 出牌
                    if (py > hand_panel_height + config.sel_posy && self.touch_state === const_val.PLAYER_TOUCH_SELF_STATE) {
                        var moving_p = self.moving_tile.getPosition();
                        moving_p = self.rootUINode.convertToWorldSpace(cc.p(moving_p.x-config.tile_width * self.moving_tile.getAnchorPoint().x, moving_p.y-config.tile_height* self.moving_tile.getAnchorPoint().y));
                        discard_tile(self.moving_tile, moving_p)
                    } else { // 放弃出牌
                        reset_tile()
                    }
                }
			} else if (eventType === ccui.Widget.TOUCH_ENDED) {
                let p = player_hand_panel.convertToNodeSpace(sender.getTouchEndPosition())
                touch_func(p, eventType)
				if (self.moving_tile) {
                    reset_tile()
				}
			}
		}
		player_hand_panel.addTouchEventListener(player_hand_panel_event)

		for(var i = 0; i < player.curGameRoom.player_num; i++){
			this.update_player_hand_tiles(i);
			var player_tile_panel = this.rootUINode.getChildByName("player_tile_panel" + i.toString());
			var player_up_panel = player_tile_panel.getChildByName("player_up_panel");
			for(var j = 0; j < 4; j++){
				var from_img = player_up_panel.getChildByName("from_img_" + j.toString());
				player_up_panel.reorderChild(from_img, 3);
			}
			this.update_player_up_tiles(i);
		}
	},

	lock_player_hand_tiles:function(){
		if(!this.is_show) {return;}
        var player = h1global.entityManager.player();
        this.touch_state = const_val.PLAYER_TOUCH_OTHER_STATE;

        this._resetSelectTile();

		if(this.moving_tile){
			this.moving_tile.removeFromParent();
			this.moving_tile = undefined;
		}
        this.isNeedDiscard = false;
	},

	unlock_player_hand_tiles:function(){
		if(!this.is_show) {return;}
        var player = h1global.entityManager.player();
        if ((player.curGameRoom.handTilesList[player.serverSitNum].length) % 3 !== 2) {
			return;
		}

        this._resetSelectTile();
        this.touch_state = const_val.PLAYER_TOUCH_SELF_STATE;
        this.isNeedDiscard = true;
	},

	_setBeginGameShow:function(is_show){
		var player = h1global.entityManager.player();
		if (player.curGameRoom.kingTiles.length > 0) {
			this.rootUINode.getChildByName("kingtile_panel").setVisible(is_show)
		}
		for (var i = 0; i < player.curGameRoom.player_num; i++) {
			var idx = i === 2 && player.curGameRoom.player_num === 3 ? 3 : i;
			var cur_player_tile_panel = this.rootUINode.getChildByName("player_tile_panel" + idx.toString()).getChildByName("player_hand_panel");
			cur_player_tile_panel.setVisible(is_show);
		}
	},

    _removeStartAnimExecutor:function (self) {
        if(self.startAnimExecutor){
            self.startAnimExecutor.removeFromParent();
            self.startAnimExecutor = undefined;
        }
    },

	startBeginAnim:function(){
		// return;
		this.beginAnimPlaying = true;
		this.lock_player_hand_tiles();
        var player = h1global.entityManager.player();
        var hand_card_panel = this.rootUINode.getChildByName("player_hand_panel");
        var operation_panel = this.rootUINode.getChildByName("operation_panel");
        if (player.curGameRoom.waitIdx == player.serverSitNum) {
            operation_panel.setVisible(false)
        }
        for (var k = 0; k < 54; k++) {
            let i = k;
            let card = ccui.helper.seekWidgetByName(hand_card_panel, "tile_img_" + String(i));
            card.setVisible(false);
            card.setTouchEnabled(false);
            card.runAction(cc.Sequence.create(
                cc.DelayTime.create(0.05 * i),
                cc.CallFunc.create(function(){
                    card.setVisible(true);
                    if (i == 53) {
                        for (let j = 0; j < 54; j++) {
                            let card = ccui.helper.seekWidgetByName(hand_card_panel, "tile_img_" + String(j));
                            card.setTouchEnabled(true);
                        }
                        if (player.curGameRoom.waitIdx == player.serverSitNum) {
                            operation_panel.setVisible(true);
                        }
                    }
                })
            ))
        }
	},

	stopBeginAnim:function(){
		return;
        this._removeStartAnimExecutor(this);
		this.beginAnimPlaying = false;
		this._setBeginGameShow(true);

		//移除骰子
        let dice_node = this.rootUINode.getChildByName("dice_anim_node");
		if(dice_node) dice_node.removeFromParent();

		var player = h1global.entityManager.player();

		for(var j = 0; j < player.curGameRoom.player_num; j++){
			this.update_player_hand_tiles(j);
			var cur_player_tile_panel = this.rootUINode.getChildByName("player_tile_panel" + j)
			var tile_down_anim_node = cur_player_tile_panel.getChildByName("tile_down_anim_node");
			if(tile_down_anim_node){
				tile_down_anim_node.removeFromParent();
				tile_down_anim_node = undefined;
			}
			var cur_player_hand_panel = cur_player_tile_panel.getChildByName("player_hand_panel");
			cur_player_hand_panel.setVisible(true);
		}
		var curPlayerSitNum = player.curGameRoom.curPlayerSitNum;
		if(player.serverSitNum == curPlayerSitNum && (player.curGameRoom.handTilesList[player.serverSitNum].length)%3==2){
			this.unlock_player_hand_tiles();
			this.update_operation_panel(player.getDrawOpDict(player.curGameRoom.lastDrawTile), const_val.SHOW_DO_OP)
		} else {
			this.lock_player_hand_tiles();
		}
        let canWinTiles = player.getCanWinTiles();
        // this.show_extra_panel(canWinTiles.length > 0);
	},

    _choose:function(card){
        if (card.is_select) {
            this._unselect(card);
        }else{
            this._select(card);
        }
    },

    _select:function(card){
        if (!card.is_select) {
            card.is_select = true;
            card.setPositionY(25);
            this._insertPrepareCard([card.card_num]);
            // cc.audioEngine.playEffect("sk/res/sound/effect/choose.mp3");
        }
    },

    _unselect:function(card){
        if (card.is_select) {
            card.is_select = false;
            card.setPositionY(0);
            cc.log("card.card_num:",card.card_num);
            this._removePrepareCard([card.card_num]);
            // cc.audioEngine.playEffect("sk/res/sound/effect/choose.mp3");
        }
    },

    _resetPrepareCards:function(){
        if (this.prepareCards.length <= 0) {
            return;
        }
        var player = h1global.entityManager.player();
        var card_list = player.curGameRoom.playerPokerList[player.serverSitNum];
        var hand_card_panel = this.rootUINode.getChildByName("player_hand_panel");
        for (var i = 0; i < card_list.length; i++) {
            var card = hand_card_panel.getChildByName("tile_img_" + String(i));
            this._unselect(card);
        }
    },

    _insertPrepareCard:function(cards_list){
        for (var i = 0; i < cards_list.length; i++) {
            this.prepareCards.push(cards_list[i]);
        }
        this.prepareCards.sort(function(a, b){return a-b;})
		// cc.log("this.prepareCards:",this.prepareCards);
        // this.update_opration_panel(false)
    },

    _removePrepareCard:function(cards_list){
        for (var i = 0; i < cards_list.length; i++) {
            var index = this.prepareCards.indexOf(cards_list[i]);
            if (index >= 0) {
                this.prepareCards.splice(index, 1)
            }
        }
        cc.warn("this.prepareCards:",this.prepareCards)
        // this.update_opration_panel(false)
    },

    _resetHandCards:function(){
        var hand_card_panel = this.rootUINode.getChildByName("player_hand_panel");
        for (var i = 0; i < 54; i++) {
            var card = ccui.helper.seekWidgetByName(hand_card_panel, "tile_img_" + String(i));
            card.is_select = false;
            card.setPositionY(0);
            card.setVisible(false);
        }
        this.prepareCards = [];
    },

    setTipsCards:function(tipsCards){
        var showCard = tipsCards.concat([]);
        if (showCard.length <= 0) {
            // this.show_no_big_tips();
            return
        }

        var player = h1global.entityManager.player();
        var card_list = player.curGameRoom.playerPokerList[player.serverSitNum];
        var hand_card_panel = this.rootUINode.getChildByName("player_hand_panel");
        var realCards = [];
        for (var l = 0 ; l < showCard.length ;) {
            for (var t = 0 ; t < card_list.length ; t++) {
                if ((card_list[t] >> 3) == showCard[l]) {
                    realCards.push(card_list[t]);
                    l ++;
                }
            }
        }

        this._resetPrepareCards();

        for (var i = 0; i < card_list.length; i++) {
            var card = hand_card_panel.getChildByName("tile_img_" + String(i));
            if (realCards.indexOf(card.card_num) >= 0) {
                this._choose(card);
                realCards.splice(realCards.indexOf(card.card_num), 1);
            }
        }
    },

    init_operation_panel:function(){
        var self = this;
        var player = h1global.entityManager.player();
        var operation_panel = this.rootUINode.getChildByName("operation_panel");
        if (player.curGameRoom.waitIdx == player.serverSitNum) {
            operation_panel.setVisible(true);
        }
        operation_panel.getChildByName("tips_btn").addTouchEventListener(function(sender, eventType){
            if (eventType === ccui.Widget.TOUCH_ENDED) {
                cc.log("tips_btn");
                var tipsCards = player.getNextTips();
                cc.log("tipsCards:",tipsCards);
                if (tipsCards && tipsCards.length > 0) {
                    self.setTipsCards(tipsCards);
                    cc.audioEngine.playEffect("res/sound/effect/choose.mp3");
                }else{
                    if (player.curGameRoom.controllerIdx != player.serverSitNum) {
                        player.doOperation(const_val.OP_PASS, []);
                        operation_panel.setVisible(false);
                    }
                }
                cc.log("tipsCards:",tipsCards);
            }
        });

        // ccui.helper.seekWidgetByName(opration_panel, "pass_btn").addTouchEventListener(function(sender, eventType){
        //     if (eventType === ccui.Widget.TOUCH_ENDED) {
        //         cc.log("pass_btn")
        //         if (player.curGameRoom.controllerIdx == player.serverSeatNum) {return}
        //         player.confirmOperation(const_val.OP_PASS, [])
        //         self.rootUINode.getChildByName("opration_panel").setVisible(false);
        //         self.update_hand_card_panel()
        //         self.prepareCards = []
        //         opration_panel.setVisible(false);
        //     }
        // })

        operation_panel.getChildByName("discard_btn").addTouchEventListener(function(sender, eventType){
            if (eventType === ccui.Widget.TOUCH_ENDED) {
                cc.log("discard_btn:",self.prepareCards);
                // var no_discards_img = self.rootUINode.getChildByName("no_discards_img");
                if (self.prepareCards.length > 0) {
                    var resultList = player.canPlayCards(self.prepareCards);
                    if (resultList[0]) {
                        player.doOperation(const_val.OP_DISCARD, resultList[1]);
                        // no_discards_img.setVisible(false);
                        operation_panel.setVisible(false);
                    } else {
                        // self.show_no_discards_tips();
                    }
                } else{
                    // self.show_no_discards_tips();
                }
            }
        });
    },

    update_operation_panel:function(isRestTipsBtn){
        var player = h1global.entityManager.player();
        var operation_panel = this.rootUINode.getChildByName("operation_panel");
        cc.log("update_operation_panel",player.curGameRoom.waitIdx , player.serverSitNum);

        cc.log("operation_panel:",operation_panel);
        var tips_btn = operation_panel.getChildByName("tips_btn");
        var discard_btn = operation_panel.getChildByName("discard_btn");

        if (isRestTipsBtn) {
            tips_btn.setVisible(true);
        }
        if (player.curGameRoom.waitIdx == player.serverSitNum) {
            operation_panel.setVisible(true);

            // if (this.prepareCards.length <= 0) {
            //     discard_btn.setTouchEnabled(false);
            //     discard_btn.setBright(false);
            // }else{
            //     discard_btn.setTouchEnabled(true);
            //     discard_btn.setBright(true);
            // }
            // if (player.curGameRoom.waitIdx == player.curGameRoom.controllerIdx) {
            //     pass_btn.setVisible(false)
            // }else{
            //     pass_btn.setVisible(true)
            // }
        } else {
            operation_panel.setVisible(false);
        }
    },

	update_player_hand_tiles: function () {
    	cc.log("update_player_hand_tiles start");
        if (!this.is_show) { return; }
        var self = this;
        var player = h1global.entityManager.player();
        var hand_card_panel = this.rootUINode.getChildByName("player_hand_panel");
        this._resetHandCards();
        // 重置所有卡牌状态
        var card_list = player.curGameRoom.playerPokerList[player.serverSitNum];
        // cutil.tileSort(card_list);
        card_list = card_list.sort(function(a, b){return a-b;});
        card_list = cutil.cardSort(card_list);
        cc.log('update_player_hand_tiles:', card_list);
        var temp_card_list = cutil.rightShiftCards(card_list);
        var card_dict = cutil.getTileNumDict(temp_card_list);
        cc.log("card_dict:",card_dict);
        var isKingBomb = ((card_dict[const_val.JOKER[0] >> 3] || 0) + (card_dict[const_val.JOKER[1] >> 3] || 0)) >= 4 ? true : false;
        function card_touch_event(sender, eventType){
            if (eventType == ccui.Widget.TOUCH_ENDED) {
                var card_num = 0;
                for (var i = 0; i < card_list.length; i++) {
                    var card = hand_card_panel.getChildByName("tile_img_" + String(i));
                    if (card.card_num >> 3 === sender.card_num >> 3) {
                    	self._choose(card);
                        card_num = card.card_num;
					}
                }
                isKingBomb = ((card_dict[const_val.JOKER[0] >> 3] || 0) + (card_dict[const_val.JOKER[1] >> 3] || 0)) >= 4 ? true : false;
                if (isKingBomb) {
                    for (var i = 0; i < card_list.length; i++) {
                        var card = hand_card_panel.getChildByName("tile_img_" + String(i));
                        if (card_num === const_val.JOKER[0] && card.card_num === const_val.JOKER[1]) {
                            self._choose(card);
                        } else if (card_num === const_val.JOKER[1] && card.card_num === const_val.JOKER[0]) {
                            self._choose(card);
                        }
                    }
                }
                cc.audioEngine.playEffect("res/sound/effect/choose.mp3");
            }
        }
        var startCardPos = 0;
        var endCardPos = 0;
        var interval = (1200 - 10 * Object.keys(card_dict).length) / card_list.length;
        hand_card_panel.setPositionX(cc.winSize.width * 0.5 + 10);
        for (var k = 0; k < this.cardNumLabelList.length; k++) {
            this.cardNumLabelList[k].removeFromParent(true);
        }
        this.cardNumLabelList = [];
        for (var i = 0; i < 54; ) {
            var card = hand_card_panel.getChildByName("tile_img_" + String(i));
            if (i < card_list.length) {
                var cardNum = card_dict[card_list[i] >> 3];
            	if (isKingBomb && card_list[i] >= const_val.JOKER[0]) {
            		cardNum = (card_dict[const_val.JOKER[0] >> 3] || 0) + (card_dict[const_val.JOKER[1] >> 3] || 0);
                    isKingBomb = false;
                }
                startCardPos = endCardPos == 0 ? 0 : endCardPos + interval + 10;
                for (var j = 0 ; j < cardNum ; j++) {
                    card = hand_card_panel.getChildByName("tile_img_" + String(i));
                    card.setTouchEnabled(true);
                    card.card_num = card_list[i];
                    card.setAnchorPoint(0, 0);
                    if (interval <= 40) {
                        card.setPositionX(startCardPos + j * interval);
                    } else {
                        card.setPositionX(i * 40 + (29 - card_list.length) / 2 * 40);
					}
                    card.loadTexture("Card/Card_" + card_list[i].toString() + ".png", ccui.Widget.PLIST_TEXTURE);
                    card.setVisible(true);
                    card.addTouchEventListener(card_touch_event);
                    if (j === cardNum - 1) {
                        this._create_label(card, cardNum);
					}
                    i++;
                }
                endCardPos = card.getPositionX();
                // if (1200 / card_list.length > 40) {
                //     card.setPositionX(i * 40 + (29 - card_list.length) / 2 * 40);
                // } else {
                //     card.setPositionX(i * 1200 / card_list.length);
                // }
            } else {
                i++;
                card.setVisible(false);
			}
        }
        cc.log("update_player_hand_tiles end");
    },

	update_player_discard_tiles:function(serverSitNum, cards){
		if(!this.is_show) {return;}
		// cc.log("update_player_discard_tiles serverSitNum:" + serverSitNum + "cards:" + cards);
        var player = h1global.entityManager.player();
        var cur_player_discard_panel = this.game_info_panel.getChildByName("player_discard_panel" + serverSitNum.toString());
		if(!cur_player_discard_panel){
			cc.warn("cur_player_discard_panel not found" , serverSitNum);
			return;
		}

        var cLen = cards.length;
        if (cards && cards[0] >= const_val.JOKER[0]) {
            cLen = cutil.getKingSizeLen(cards)[1];
        }
        var line_img = cur_player_discard_panel.getChildByName("line_img");
        line_img.setVisible(false);
        if (cLen >= 7) {
            line_img.loadTexture("res/ui/GameRoomUI/line_" + cLen.toString() + ".png");
            line_img.setVisible(true);
            line_img.setAnchorPoint(0.5, 0.5);
            // line_img.setPositionX(cur_player_discard_panel.getContentSize().width * 0.3);
            // line_img.runAction(cc.spawn(
            //     cc.sequence(cc.fadeIn(0.5),cc.fadeOut(0.5)),
            //     cc.moveTo(1, cc.p(cur_player_discard_panel.getContentSize().width * 0.6, cur_player_discard_panel.getContentSize().height * 0.5))
            // ))
        }
		if ((serverSitNum + 1) % 2 === 1) {
            cur_player_discard_panel.setPositionX(this.game_info_panel.getContentSize().width * (0.70 - 0.0125 * cards.length));
		}
        for (var i = 0; i < 16; i++) {
            var card = ccui.helper.seekWidgetByName(cur_player_discard_panel, "tile_img_" + String(i));
            card.setVisible(false);
        }

        for (var i = 0; i < cards.length; i ++) {
            var card = cur_player_discard_panel.getChildByName("tile_img_" + String(i));
            card.loadTexture("Card/Card_" + cards[i].toString() + ".png", ccui.Widget.PLIST_TEXTURE);
            if (card.getChildByName("discardNum")) {
                card.getChildByName("discardNum").removeFromParent(true);
            }
            if (i === 0 && serverSitNum === 1) {
                this._create_label(card, cards.length, false);
            } else if (i === cards.length - 1 && serverSitNum !== 1) {
                this._create_label(card, cards.length, false);
			}
			if (i === Math.floor(cards.length / 2 + 1)) {
                if (serverSitNum === 1) {
                    line_img.setPositionX(card.getPositionX() + 80);
                } else {
                    line_img.setPositionX(card.getPositionX());
                }
            }
            card.setVisible(true);
        }
        cur_player_discard_panel.setVisible(true);
	},

	_create_label:function (parentNode, num, isPush) {
        isPush = isPush === false ? isPush : true;
        var cardNumLabel = ccui.Text.create();
        cardNumLabel.setString(num.toString());
        cardNumLabel.setPositionX(5);
        cardNumLabel.setFontSize(30);
        cardNumLabel.setTextColor(cc.color(0,0,0));
        cardNumLabel.setAnchorPoint(0, 0);
        parentNode.addChild(cardNumLabel);
        if (isPush) {
            this.cardNumLabelList.push(cardNumLabel);
        } else {
            cardNumLabel.setName("discardNum");
		}
    },

	playOperationFunc:function (curSitNum) {

        //动作的位置
        function opPos (curSitNum, bomb_sprite) {
            var size = cc.size(cc.winSize.width, cc.winSize.height);
            if (curSitNum == 0) {
                bomb_sprite.setPosition(cc.p(size.width * 0.5, size.height * 0.4));
            } else if (curSitNum == 1) {
                bomb_sprite.setPosition(cc.p(size.width * 0.8, size.height * 0.6));
            } else if (curSitNum == 2) {
                bomb_sprite.setPosition(cc.p(size.width * 0.5, size.height * 0.8));
            } else if (curSitNum == 3) {
                bomb_sprite.setPosition(cc.p(size.width * 0.2, size.height * 0.6));
            } else {
                bomb_sprite.setPosition(cc.p(size.width * 0.5, size.height * 0.6));
            }
        }

    	var self = this;
        UICommonWidget.load_effect_plist("action_bomb");
        var bomb_sprite = cc.Sprite.create();
        opPos(curSitNum, bomb_sprite);
        self.rootUINode.addChild(bomb_sprite);
        bomb_sprite.runAction(cc.Sequence.create(
            UICommonWidget.create_effect_action({"FRAMENUM": 25, "TIME": 1.5, "NAME": "action/action_bomb_"}),
            cc.CallFunc.create(function() {
                bomb_sprite.removeFromParent();
            })
        ));

        cc.audioEngine.playEffect("res/sound/effect/bomb.mp3");
    },

    playOperationEffect:function(opId, serverSitNum, card) {
        if(!this.is_show) {return;}
	    if (card.length < 4) {return;}
        var curSitNum = -1;
        if(serverSitNum === undefined) {
            curSitNum = -1;
        } else {
            curSitNum = h1global.entityManager.player().server2CurSitNum(serverSitNum);
        }
        if (opId == const_val.OP_DISCARD) {
            this.playOperationFunc(curSitNum);
        }
    },

	playEmotionAnim:function(serverSitNum, eid){
    	var curSitNum = h1global.entityManager.player().server2CurSitNum(serverSitNum);
		var player_info_panel = this.rootUINode.getChildByName("player_info_panel" + curSitNum);
        var talk_img = ccui.ImageView.create();
        // talk_img.setPosition(this.getMessagePos(player_info_panel).x - 70, this.getMessagePos(player_info_panel).y + 10);
        talk_img.setPosition(this.getMsgPos(player_info_panel, curSitNum));
        talk_img.loadTexture("res/ui/Default/talk_frame.png");
        talk_img.setScale9Enabled(true);
        talk_img.setContentSize(cc.size(100, 120));
        this.rootUINode.addChild(talk_img);
        var talk_angle_img = ccui.ImageView.create();
        talk_angle_img.loadTexture("res/ui/Default/talk_angle.png");
        talk_img.addChild(talk_angle_img);
		// 加载表情图片
		cc.Texture2D.defaultPixelFormat = cc.Texture2D.PIXEL_FORMAT_RGBA4444;
        var cache = cc.spriteFrameCache;
        var plist_path = "res/effect/biaoqing.plist";
        var png_path = "res/effect/biaoqing.png";
        cache.addSpriteFrames(plist_path, png_path);
    	cc.Texture2D.defaultPixelFormat = cc.Texture2D.PIXEL_FORMAT_RGBA8888;

    	var anim_frames = [];
        for (var i = 1; i <= const_val.ANIM_LIST[eid - 1] ; i++) {
            var frame = cache.getSpriteFrame("Emot/biaoqing_" + eid.toString() + "_" + i.toString() + ".png");
            if (frame) {
                anim_frames.push(frame);
            }
        }
        var effect_animation = new cc.Animation(anim_frames, 1.2 / const_val.ANIM_LIST[eid - 1]);
        var effect_action = new cc.Animate(effect_animation);

        var emot_sprite = cc.Sprite.create();
        // emot_sprite.setScale(1.0);
        emot_sprite.setScale(0.4);
        emot_sprite.setPosition(cc.p(50, 60));
        // emot_sprite.setPosition(this.getMessagePos(player_info_panel));
        talk_img.addChild(emot_sprite);
        if(curSitNum > 0 && curSitNum < 3){
            talk_img.setScaleX(-1);
            talk_img.setPositionX(talk_img.getPositionX() - 40);
            talk_img.setPositionY(talk_img.getPositionY() - 10);
        }else {
            talk_img.setPositionX(talk_img.getPositionX() + 40);
            talk_angle_img.setLocalZOrder(3);
        }
        talk_angle_img.setPosition(3, talk_angle_img.getPositionY() + 50);
        emot_sprite.runAction(cc.Sequence.create(cc.Repeat.create(effect_action, 2), cc.CallFunc.create(function(){
            talk_img.removeFromParent();
        })));
	},

    getMsgPos:function(playerInfoPanel, idx){
        var pos = playerInfoPanel.getPosition();
        if(idx == 1){
            pos = cc.p(pos.x - playerInfoPanel.width, pos.y + playerInfoPanel.height * 0.5);
        } else if(idx == 2){
            pos = cc.p(pos.x, pos.y - playerInfoPanel.height * 0.5);
        } else if(idx == 3){
            pos = cc.p(pos.x + playerInfoPanel.width, pos.y + playerInfoPanel.height * 0.5);
        } else {
            pos = cc.p(pos.x + playerInfoPanel.width, pos.y + playerInfoPanel.height * 0.5);
        }
        return pos;
    },

	playMessageAnim:function(serverSitNum, mid, msg){
		var idx = h1global.entityManager.player().server2CurSitNum(serverSitNum);
		var player_info_panel = this.rootUINode.getChildByName("player_info_panel" + idx);
		var talk_img = ccui.ImageView.create();
		var talk_angle_img = ccui.ImageView.create();
        talk_img.setAnchorPoint(0,0.5);
		talk_img.setPosition(this.getMsgPos(player_info_panel, idx));
		talk_img.loadTexture("res/ui/Default/talk_frame.png");
        talk_angle_img.loadTexture("res/ui/Default/talk_angle.png");
        talk_img.addChild(talk_angle_img);
		this.rootUINode.addChild(talk_img);

		var msg_label = cc.LabelTTF.create("", "Arial", 22);
        msg_label.setString(mid < 0 ? msg : const_val.MESSAGE_LIST[mid]);
        msg_label.setDimensions(msg_label.getString().length * 26, 0);
		msg_label.setColor(cc.color(20, 85, 80));
		msg_label.setAnchorPoint(cc.p(0.5, 0.5));
        talk_img.addChild(msg_label);
        talk_img.setScale9Enabled(true);
        talk_img.setContentSize(cc.size(msg_label.getString().length * 23 + 20, talk_img.getContentSize().height));
        talk_angle_img.setPosition(3,talk_img.getContentSize().height*0.5);
        if(idx > 0 && idx < 3){
            msg_label.setPosition(cc.p(msg_label.getString().length * 26 * 0.37 + 10, 23));
            talk_img.setScaleX(-1);
            msg_label.setScaleX(-1);
        }else {
            msg_label.setPosition(cc.p(msg_label.getString().length * 26 * 0.50 + 13, 23));
            talk_angle_img.setLocalZOrder(3);
        }
        msg_label.runAction(cc.Sequence.create(cc.DelayTime.create(2.0), cc.CallFunc.create(function(){
        	talk_img.removeFromParent();
        })));
	},

	getExpressionPos:function (player_info_panel, idx) {
		var pos = player_info_panel.getPosition();
        if(idx == 1){
            pos = cc.p(pos.x - player_info_panel.width * 0.5, pos.y + player_info_panel.height * 0.5);
        } else if(idx == 2){
            pos = cc.p(pos.x + player_info_panel.width * 0.5, pos.y - player_info_panel.height * 0.5);
        } else if(idx == 3){
            pos = cc.p(pos.x + player_info_panel.width * 0.5, pos.y + player_info_panel.height * 0.5);
        } else {
            pos = cc.p(pos.x + player_info_panel.width * 0.5, pos.y + player_info_panel.height * 0.5);
        }
        return pos;
    },

    playExpressionAnim:function (fromIdx, toIdx, eid) {
        var self = this;
        if (eid === 3) {	//因为扔钱动画不是plist，所以单独处理
            self.playMoneyAnim(fromIdx, toIdx);
            return;
        }
        var rotate = 0;
        var moveTime = 0.7;
        var flag = (fromIdx % 3 == 0 && toIdx % 3 == 0) || (fromIdx % 3 != 0 && toIdx % 3 != 0);
        if(flag){
        	moveTime = 0.3;
		}
        var player_info_panel = this.rootUINode.getChildByName("player_info_panel" + fromIdx.toString());
        var expression_img = ccui.ImageView.create();
        expression_img.setPosition(this.getExpressionPos(player_info_panel, fromIdx));
        expression_img.loadTexture("res/ui/PlayerInfoUI/expression_"+ const_val.EXPRESSION_ANIM_LIST[eid] +".png");
        this.rootUINode.addChild(expression_img);
        // if(eid > 1){
         //    rotate = 1440;
         //    rotate = rotate + (moveTime - 0.7) * 1800;
		// }
        expression_img.runAction(cc.Spawn.create(cc.RotateTo.create(0.2 + moveTime, rotate), cc.Sequence.create(
        	cc.ScaleTo.create(0.1, 1.5),
        	cc.ScaleTo.create(0.1, 1),
            cc.MoveTo.create(moveTime, self.getExpressionPos(self.rootUINode.getChildByName("player_info_panel" + toIdx.toString()), toIdx)),
            cc.CallFunc.create(function(){
                expression_img.removeFromParent();
                self.playExpressionAction(toIdx, self.getExpressionPos(self.rootUINode.getChildByName("player_info_panel" + toIdx.toString()), toIdx), eid);
            })
        )));
    },

    playMoneyAnim:function (fromIdx, toIdx) {
		var self = this;
        var player_info_panel = this.rootUINode.getChildByName("player_info_panel" + fromIdx.toString());
        var money_img_list = [];
        for (var j = 0 ; j < 10 ; j++) {
            var money_img = ccui.ImageView.create();
            money_img.setPosition(this.getExpressionPos(player_info_panel, fromIdx));
            money_img.loadTexture("res/ui/PlayerInfoUI/expression_money.png");
            money_img.setVisible(false);
            this.rootUINode.addChild(money_img);
            money_img_list.push(money_img);
        }
        var pos = self.getExpressionPos(self.rootUINode.getChildByName("player_info_panel" + toIdx.toString()), toIdx);
        for (let i = 0 ; i < 10 ; i++) {
        	var random_pos = cc.p(Math.random() * 60 - 30, Math.random() * 60 - 30);
			(function (i) {
                money_img_list[i].runAction(cc.sequence(
                    cc.delayTime(i * 0.2),
                    cc.callFunc(function () {
                        money_img_list[i].setVisible(true);
                    }),
                    cc.moveTo(0.3, pos.x + random_pos.x, pos.y + random_pos.y),
                    cc.delayTime(1 + (9 - i) * 0.2),
                    cc.callFunc(function () {
                        money_img_list[i].removeFromParent(true);
                    })
                ));
            })(i)
		}
    },

    playExpressionAction : function(idx, pos, eid){
		if(idx < 0 || idx > 3){
			return;
		}
		var self = this;
		UICommonWidget.load_effect_plist("expression");
		var expression_sprite = cc.Sprite.create();
		// var ptime = 2;
		// if(eid == 3){
         //    expression_sprite.setScale(2);
		// }
        expression_sprite.setPosition(pos);
		self.rootUINode.addChild(expression_sprite);
        expression_sprite.runAction(cc.Sequence.create(
			UICommonWidget.create_effect_action({"FRAMENUM": const_val.EXPRESSION_ANIMNUM_LIST[eid], "TIME": const_val.EXPRESSION_ANIMNUM_LIST[eid] / 16, "NAME": "Expression/"+ const_val.EXPRESSION_ANIM_LIST[eid] +"_"}),
			cc.DelayTime.create(0.5),
			cc.CallFunc.create(function(){
                expression_sprite.removeFromParent();
			})
		));
    },

	playVoiceAnim:function(serverSitNum, record_time){
		var self = this;
		if(cc.audioEngine.isMusicPlaying()){
            cc.audioEngine.pauseMusic();
        }
        var idx = h1global.entityManager.player().server2CurSitNum(serverSitNum);
        var interval_time = 0.8;
		this.talk_img_num += 1;
		// var player_info_panel = this.rootUINode.getChildByName("player_info_panel" + h1global.entityManager.player().server2CurSitNum(serverSitNum));
		var player_info_panel = undefined;
		if(serverSitNum < 0){
			player_info_panel = this.rootUINode.getChildByName("agent_info_panel");
		} else {
			player_info_panel = this.rootUINode.getChildByName("player_info_panel" + h1global.entityManager.player().server2CurSitNum(serverSitNum));
		}
		var talk_img = ccui.ImageView.create();
        talk_img.setPosition(this.getMsgPos(player_info_panel, idx));
		talk_img.loadTexture("res/ui/Default/talk_frame.png");
        talk_img.setScale9Enabled(true);
        talk_img.setContentSize(cc.size(100, talk_img.getContentSize().height));
		this.rootUINode.addChild(talk_img);
        var talk_angle_img = ccui.ImageView.create();
        talk_angle_img.loadTexture("res/ui/Default/talk_angle.png");
        talk_img.addChild(talk_angle_img);

        var voice_img1 = ccui.ImageView.create();
        voice_img1.loadTexture("res/ui/Default/voice_img1.png");
        voice_img1.setPosition(cc.p(50, 23));
        talk_img.addChild(voice_img1);
        var voice_img2 = ccui.ImageView.create();
        voice_img2.loadTexture("res/ui/Default/voice_img2.png");
        voice_img2.setPosition(cc.p(50, 23));
        voice_img2.setVisible(false);
        talk_img.addChild(voice_img2);
        voice_img2.runAction(cc.RepeatForever.create(cc.Sequence.create(cc.DelayTime.create(interval_time), cc.CallFunc.create(function(){voice_img1.setVisible(false);voice_img2.setVisible(true);voice_img3.setVisible(false);}), cc.DelayTime.create(interval_time*2), cc.CallFunc.create(function(){voice_img2.setVisible(false)}))));
        var voice_img3 = ccui.ImageView.create();
        voice_img3.loadTexture("res/ui/Default/voice_img3.png");
        voice_img3.setPosition(cc.p(50, 23));
        voice_img3.setVisible(false);
        talk_img.addChild(voice_img3);
        voice_img3.runAction(cc.RepeatForever.create(cc.Sequence.create(cc.DelayTime.create(interval_time*2), cc.CallFunc.create(function(){voice_img1.setVisible(false);voice_img2.setVisible(false);voice_img3.setVisible(true);}), cc.DelayTime.create(interval_time), cc.CallFunc.create(function(){voice_img3.setVisible(false);voice_img1.setVisible(true);}))));
        talk_angle_img.setPosition(3,talk_img.getContentSize().height*0.5);
        if(idx > 0 && idx < 3){
            talk_img.setScale(-1);
            talk_img.setPositionX(talk_img.getPositionX() - 40);
        }else {
            talk_img.setPositionX(talk_img.getPositionX() + 40);
            talk_angle_img.setLocalZOrder(3);
        }
        talk_img.runAction(cc.Sequence.create(cc.DelayTime.create(record_time), cc.CallFunc.create(function(){
        	talk_img.removeFromParent();
        	self.talk_img_num -= 1;
        	if(self.talk_img_num == 0){
        		if(!cc.audioEngine.isMusicPlaying()){
		            cc.audioEngine.resumeMusic();
		        }
        	}
        })));
        // return talk_img;
	},

	update_roominfo_panel:function(){
		return;
		if(!this.is_show){
			return;
		}
		var player = h1global.entityManager.player();
		var room_info_panel = this.rootUINode.getChildByName("room_info_panel");
		var lefttile_label = room_info_panel.getChildByName("lefttile_label");
        lefttile_label.setString(Math.max(0, player.curGameRoom.leftTileNum).toString());
	},

    update_curscore_panel:function() {
        if(!this.is_show){
            return;
        }
        var player = h1global.entityManager.player();
        var score_panel = this.rootUINode.getChildByName("score_panel");
        var score_label = score_panel.getChildByName("score_label");
        score_label.setString(player.curGameRoom.curround_score);
    },

    update_curscore_curprize_panel : function (serverSitNum) {
        if (!this.is_show) {return;}
        if (serverSitNum < 0 || serverSitNum > 3) {
            return;
        }
        var player = h1global.entityManager.player();
        var idx = player.server2CurSitNum(serverSitNum);
        var cur_player_info_panel = this.rootUINode.getChildByName("player_info_panel" + idx.toString());
        var curscore_label = cur_player_info_panel.getChildByName("curscore_label");
        curscore_label.setString(player.curGameRoom.curScoreList[serverSitNum]);
        var curprize_label = cur_player_info_panel.getChildByName("curprize_label");
        var curprize_score = 0;
        for (var i = 0 ; i < player.curGameRoom.curPrizeList.length; i++) {
        	if (i === serverSitNum) {
        		curprize_score += player.curGameRoom.curPrizeList[i] * 90;
			} else {
                curprize_score -= player.curGameRoom.curPrizeList[i] * 30;
			}
		}
        curprize_label.setString(curprize_score);
    },

    show_cur_idx_frame: function(waitidx){
        if (!this.is_show) {return;}
        if (waitidx < 0 || waitidx > 3) {
            return;
        }
        cc.log("show_cur_idx_frame  is  running , waitIdx :" + h1global.entityManager.player().server2CurSitNum(waitidx));
        for(var i = 0 ;i< 4;i++){
            var player_info_panel = this.rootUINode.getChildByName("player_info_panel" + i);
            var cur_idx_frame_img = player_info_panel.getChildByName("cur_idx_frame_img");
            if (i == h1global.entityManager.player().server2CurSitNum(waitidx)) {
                cur_idx_frame_img.setVisible(true);
            } else {
                cur_idx_frame_img.setVisible(false);
            }
        }
    },

	update_win_player:function () {
        if (!this.is_show) {return;}
        var player = h1global.entityManager.player();
        cc.log("player.curGameRoom.win_list:", player.curGameRoom.win_list);
        for (var i = 0 ; i < 4 ; i ++) {
            var idx = player.server2CurSitNum(i);
            var cur_player_info_panel = this.rootUINode.getChildByName("player_info_panel" + idx.toString());
            var rank_img = cur_player_info_panel.getChildByName("rank_img");
            if (player.curGameRoom.win_list.indexOf(i) >= 0) {
                var rank = player.curGameRoom.win_list.indexOf(i);
                rank_img.loadTexture("res/ui/GameRoomUI/" + const_val.RANK_LIST[rank] + ".png");
                rank_img.setVisible(true);
			} else {
                rank_img.setVisible(false);
			}
        }
    },

    update_not_discard_panel:function (serverSitNum, flag) {
        if (!this.is_show) {return;}
        var player = h1global.entityManager.player();
        var not_discard_panel = this.rootUINode.getChildByName("not_discard_panel");
        // not_discard_panel.setVisible(true);
        var idx = player.server2CurSitNum(serverSitNum);
        var not_discard_img = not_discard_panel.getChildByName("not_discard_img_" + idx.toString());
        if (flag === const_val.OP_PASS) {
            not_discard_img.setVisible(true);
        } else {
            not_discard_img.setVisible(false);
        }
    },

    update_no_big_panel:function (serverSitNum) {
        if (!this.is_show) {return;}
        var self = this;
        var player = h1global.entityManager.player();
        var tips_panel = this.rootUINode.getChildByName("tips_panel");
        if (serverSitNum === player.serverSitNum) {
            tips_panel.setVisible(true);
            tips_panel.runAction(cc.spawn(
                cc.sequence(cc.fadeIn(0.3), cc.delayTime(0.3), cc.fadeOut(0.3)),
                cc.sequence(cc.moveBy(0.6, 0, 50), cc.delayTime(0.3), cc.callFunc(function () {
                    tips_panel.setVisible(false);
                    tips_panel.setPositionY(self.rootUINode.getContentSize().height * 0.26);
                }))
            ));
        }
    }
});