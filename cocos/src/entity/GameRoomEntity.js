"use strict";

var GameRoomEntity = KBEngine.Entity.extend({
	ctor : function(player_num)
	{
		
		this._super();
		this.roomID = undefined;
		this.curRound = 0;

		this.maxRound = 8;
		this.luckyTileNum = 0;
		this.ownerId = undefined;
		this.dealerIdx = 0;
		this.roomType = undefined;
		this.king_num = 1;
  		this.player_num = player_num || 4;
  		this.pay_mode = 0;
  		this.game_mode = 0;
  		this.game_max_lose  = 999999;
  		this.round_max_lose = 999999;
  		this.base_score = 0;
  		this.begin_dealer_mul = 1;
  		this.bao_tou = 0;
  		this.cur_dealer_mul = 1;
  		this.king_mode = 0;
  		this.pong_useful = 0;
  		this.three_job = 0;
  		this.win_mode = 0;
  		this.hand_prepare = 1;
    	this.club_id = 0;

		this.playerInfoList = [null, null, null, null];
		this.playerDistanceList = [[-1,-1,-1,-1], [-1,-1,-1,-1], [-1,-1,-1,-1], [-1,-1,-1,-1]];
		this.playerStateList = [0, 0, 0, 0];
		this.handTilesList = [[], [], [], []];
		this.upTilesList = [[], [], [], []];
		this.upTilesOpsList = [[], [], [], []];
		this.discardTilesList = [[], [], [], []];
		this.cutIdxsList = [[], [], [], []];
		this.wreathsList = [[], [], [], []];

        this.controllerIdx = -1;
        this.controller_discard_list = [];
        this.waitIdx = -1;
        this.curround_score = 0;
        this.curScoreList = [0,0,0,0];			//玩家本局得分（除了奖励分）
        this.curPrizeList = [0,0,0,0];			//玩家本局得奖
		this.win_list = [];
        this.playerPokerList = [[],[],[],[]];	//玩家手牌
        this.deskPokerList = [[],[],[],[]];		//桌面牌
        this.player_advance_info_list = [{}, {}, {}, {}];

		this.prevailing_wind = const_val.WIND_EAST
		this.playerWindList = [const_val.WIND_EAST, const_val.WIND_SOUTH, const_val.WIND_WEST, const_val.WIND_NORTH]
		this.curPlayerSitNum = 0;
		this.room_state = const_val.ROOM_WAITING;
		this.lastDiscardTile = -1;
		this.lastDrawTile = -1;
    	this.last_op = -1;
		this.lastDiscardTileFrom = -1;
		this.discard_king_idx = -1;
		this.leftTileNum = 60;

		this.kingTiles = [];	// 财神(多个)

		this.applyCloseLeftTime = 0;
		this.applyCloseFrom = 0;
		this.applyCloseStateList = [0, 0, 0, 0];

		this.waitAidList = []; // 玩家操作列表，[]表示没有玩家操作

		// 每局不清除的信息
		this.playerScoreList = [0, 0, 0, 0];
		this.msgList = [];		//所有的聊天记录
	    KBEngine.DEBUG_MSG("Create GameRoomEntity")
  	},

  	reconnectRoomData : function(recRoomInfo){
  		cc.log("reconnectRoomData",recRoomInfo);
  		this.playerStateList = recRoomInfo["player_state_list"];
        this.controllerIdx = recRoomInfo["controllerIdx"];
        this.controller_discard_list = recRoomInfo["controller_discard_list"];
        this.deskPokerList = recRoomInfo["deskPokerList"];
        // // this.deskPokerList = [[],[],[],[]];
        this.room_state = recRoomInfo["room_state"];
        this.waitIdx = recRoomInfo["waitIdx"];
        this.win_list = recRoomInfo["win_list"];
        this.curround_score = recRoomInfo["curround_score"];
        this.curScoreList = recRoomInfo["curScoreList"];
        this.curPrizeList = recRoomInfo["curPrizeList"];
        this.playerStateList = recRoomInfo["player_state_list"];

        this.player_advance_info_list = recRoomInfo["player_advance_info_list"];
        for (var i = 0; i < this.player_advance_info_list.length; i++) {
            this.playerPokerList[i] = this.player_advance_info_list[i]["tiles"];
        }
        cc.log("playerPokerList:", this.playerPokerList);

		this.updateRoomData(recRoomInfo["init_info"]);
		for(var i = 0; i < recRoomInfo["player_advance_info_list"].length; i++){
			var curPlayerInfo = recRoomInfo["player_advance_info_list"][i];
			this.playerInfoList[i]["score"] = curPlayerInfo["score"];
			this.playerInfoList[i]["total_score"] = curPlayerInfo["total_score"];
		}

        this.applyCloseLeftTime = recRoomInfo["applyCloseLeftTime"];
        this.applyCloseFrom = recRoomInfo["applyCloseFrom"];
        this.applyCloseStateList = recRoomInfo["applyCloseStateList"];
        if(this.applyCloseLeftTime > 0){
            onhookMgr.setApplyCloseLeftTime(this.applyCloseLeftTime);
        }
        if (const_val.FAKE_COUNTDOWN > 0) {
            onhookMgr.setWaitLeftTime(const_val.FAKE_COUNTDOWN);
        }
  	},

  	updateRoomData : function(roomInfo){
  		cc.log('updateRoomData:',roomInfo)
  		this.roomID = roomInfo["roomID"];
  		this.ownerId = roomInfo["ownerId"];
  		this.dealerIdx = roomInfo["dealerIdx"];
  		this.curRound = roomInfo["curRound"]
  		this.maxRound = roomInfo["maxRound"];
  		this.king_num = roomInfo["king_num"];
  		this.player_num = roomInfo["player_num"];
  		this.pay_mode = roomInfo["pay_mode"];
  		this.game_mode = roomInfo["game_mode"];
  		this.roomType = roomInfo["roomType"];
		this.round_max_lose= roomInfo["round_max_lose"];
		this.luckyTileNum = roomInfo["lucky_num"];
		this.hand_prepare = roomInfo["hand_prepare"];

        this.game_max_lose  = roomInfo["game_max_lose"];
        this.round_max_lose = roomInfo["round_max_lose"];
        this.base_score = roomInfo["base_score"];
        this.begin_dealer_mul = roomInfo["begin_dealer_mul"];
        this.bao_tou = roomInfo["bao_tou"];
        this.cur_dealer_mul = roomInfo["cur_dealer_mul"];
        this.king_mode = roomInfo["king_mode"];
        this.pong_useful = roomInfo["pong_useful"];
        this.three_job = roomInfo["three_job"];
        this.win_mode = roomInfo["win_mode"];
        this.club_id = roomInfo["club_id"];

  		for(var i = 0; i < roomInfo["player_base_info_list"].length; i++){
  			this.updatePlayerInfo(roomInfo["player_base_info_list"][i]["idx"], roomInfo["player_base_info_list"][i]);
		}
        this.updateDistanceList();
		this.addMenuShareAppMsg()
  	},

  	updatePlayerInfo : function(serverSitNum, playerInfo){
  		this.playerInfoList[serverSitNum] = playerInfo;
  	},

  	updatePlayerState : function(serverSitNum, state){
  		this.playerStateList[serverSitNum] = state;
  	},

  	updatePlayerOnlineState : function(serverSitNum, state){
  		this.playerInfoList[serverSitNum]["online"] = state;
  	},

	updateDistanceList : function () {
        for(var i = 0 ; i < this.playerInfoList.length ; i++) {
            for(var j = 0 ; j < this.playerInfoList.length ; j++) {
                if(i === j){this.playerDistanceList[i][j] = -1;continue;}
                if(this.playerInfoList[i] && this.playerInfoList[j]) {
					var distance = cutil.calc_distance(parseFloat(this.playerInfoList[i]["lat"]), parseFloat(this.playerInfoList[i]["lng"]), parseFloat(this.playerInfoList[j]["lat"]), parseFloat(this.playerInfoList[j]["lng"]));
                    this.playerDistanceList[i][j] = (distance || distance == 0 ? distance : -1);
                }else {
                    this.playerDistanceList[i][j] = -1;
				}
            }
        }
    },

	getRoomCreateDict:function () {
  		return {
            "maxRound" 			: this.maxRound,
			"pay_mode" 			: this.pay_mode,
		};
    },

  	startGame : function(){
  		this.curRound = this.curRound + 1;
  		this.room_state = const_val.ROOM_PLAYING;
  		// this.wreathsList = wreathsList;
  		// this.kingTiles = kingTiles;
  		var wreathsNum = 0;
      	this.last_op = -1;
        this.discard_king_idx = -1;
  		// for (var i = 0; i < wreathsList.length; i++) {
  		// 	wreathsNum += wreathsList[i].length
  		// }
		this.handTilesList = [	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
							[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
							[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
							[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]];
  		this.upTilesList = [[], [], [], []];
  		this.upTilesOpsList = [[], [], [], []];
  		this.discardTilesList = [[], [], [], []];
  		this.cutIdxsList = [[], [], [], []];
  		this.waitAidList = [];
  		if (this.king_mode === 1) {
            this.leftTileNum = 82 - wreathsNum;
        } else {
            this.leftTileNum = 83 - wreathsNum;
        }

        this.room_state = const_val.ROOM_PLAYING;
        this.playerPokerList = [[0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0, 0,0,0,0],
								[0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0, 0,0,0,0],
								[0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0, 0,0,0,0],
								[0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0, 0,0,0,0]];
        this.deskPokerList = [[],[],[],[]];
        this.waitIdx = this.controllerIdx;
        this.curround_score = 0;
        this.controller_discard_list = [];
        this.curScoreList = [0,0,0,0];
        this.curPrizeList = [0,0,0,0];
        this.win_list = [];
  	},

	swap_seat : function (swap_list) {
        if(!swap_list){
            return;
        }
        var tempPlayerInfoList = [];
        for (var i = 0; i < swap_list.length; i++) {
            tempPlayerInfoList[i] = this.playerInfoList[swap_list[i]];
            tempPlayerInfoList[i].idx = i;
        }
        cc.log(tempPlayerInfoList)
        this.playerInfoList = tempPlayerInfoList
    },

  	endGame : function(){
  		// 重新开始准备
  		this.room_state = const_val.ROOM_WAITING;
  		this.playerStateList = [0, 0, 0, 0];
  	},

  	addMenuShareAppMsg : function(){
  		var self = this;
        if(!((cc.sys.os == cc.sys.OS_IOS && cc.sys.isNative) || (cc.sys.os == cc.sys.OS_ANDROID && cc.sys.isNative)) || switches.TEST_OPTION){
            var share_title = switches.gameName + ' 房间号【' + self.roomID.toString() + '】,招募群主,1000红包奖励群主!';
            var share_desc = cutil.share_lack_str(this) +cutil.get_playing_room_detail(this);
            cutil.share_func(share_title, share_desc);
		}
  	},
});