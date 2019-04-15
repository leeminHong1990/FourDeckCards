# -*- coding: utf-8 -*-

import KBEngine
from KBEDebug import *
import utility
import const
import random

class iRoomRules(object):

	def __init__(self):
		# 房间的牌堆
		self.tiles = []
		self.meld_dict = dict()

	def swapSeat(self, swap_list):
		random.shuffle(swap_list)
		for i in range(len(swap_list)):
			self.players_list[i] = self.origin_players_list[swap_list[i]]

		for i,p in enumerate(self.players_list):
			if p is not None:
				p.idx = i

	def initTiles(self):
		self.tiles = (const.HEI + const.HONG + const.MEI + const.FANG + const.JOKER) * 4
		DEBUG_MSG("room:{},curround:{} init tiles:{}".format(self.roomID, self.current_round, self.tiles))
		self.shuffle_tiles()

	def shuffle_tiles(self):
		random.shuffle(self.tiles)
		DEBUG_MSG("room:{},curround:{} shuffle tiles:{}".format(self.roomID, self.current_round, self.tiles))

	def deal(self, prefabHandTiles):
		""" 发牌 """
		if prefabHandTiles is not None:
			for i,p in enumerate(self.players_list):
				if p is not None and len(prefabHandTiles) >= 0:
					p.tiles = prefabHandTiles[i] if len(prefabHandTiles[i]) <= const.INIT_TILE_NUMBER else prefabHandTiles[i][0:const.INIT_TILE_NUMBER]
					for v in p.tiles:
						self.tiles.remove(v)

			for i in range(const.INIT_TILE_NUMBER):
				num = 0
				for j in range(self.player_num):
					if len(self.players_list[j].tiles) >= const.INIT_TILE_NUMBER:
						continue
					self.players_list[j].tiles.append(self.tiles[num])
					num += 1
				self.tiles = self.tiles[num:]
		else:
			for i in range(const.INIT_TILE_NUMBER):
				for j in range(self.player_num):
					self.players_list[j].tiles.append(self.tiles[j])
				self.tiles = self.tiles[self.player_num:]

		for i, p in enumerate(self.players_list):
			DEBUG_MSG("room:{},curround:{} idx:{} deal tiles:{}".format(self.roomID, self.current_round, i, p.tiles))

	def tidy(self):
		""" 整理 """
		for i in range(self.player_num):
			self.players_list[i].tidy(self.kingTiles)

	def throwDice(self, idxList):
		diceList = [[0,0] for i in range(self.player_num)]
		for i in range(len(diceList)):
			if i in idxList:
				diceList[i][0] = random.randint(1, 6)
				diceList[i][1] = random.randint(1, 6)
		return diceList

	def swapTileToTop(self, tile):
		if tile in self.tiles:
			tileIdx = self.tiles.index(tile)
			self.tiles[0], self.tiles[tileIdx] = self.tiles[tileIdx], self.tiles[0]

	def is_op_times_limit(self, idx):
		"""吃碰杠次数限制"""
		if self.three_job and (idx == self.dealer_idx or self.last_player_idx == self.dealer_idx): # 三摊 承包的模式 庄闲之间 无限制
			return False
		op_r = self.players_list[idx].op_r
		include_op_list = [const.OP_CHOW, const.OP_PONG, const.OP_EXPOSED_KONG] if self.pong_useful else [const.OP_CHOW]
		times = sum([1 for record in op_r if record[2] == self.last_player_idx and record[0] in include_op_list])
		return times >= 2

	def is_op_kingTile_limit(self, idx):
		"""打财神后操作限制"""
		if self.discard_king_idx >= 0 and self.discard_king_idx != idx:
			return True
		return False

	def is_op_limit(self, idx):
		"""操作限制"""
		if self.is_op_times_limit(idx) or self.is_op_kingTile_limit(idx):
			return True
		return False

	def circleSameTileNum(self, idx, t):
		"""获取一圈内打出同一张牌的张数"""
		discard_num = 0
		for record in reversed(self.op_record):
			if record[1] == idx:
				break
			if record[0] == const.OP_DISCARD and record[3][0] == t:
				discard_num += 1
		return discard_num

	def can_cut_after_kong(self):
		return False

	def can_discard(self, idx, t):
		if self.is_op_kingTile_limit(idx):
			if t == self.players_list[idx].last_draw:
				return True
			return False
		return True

	def can_chow(self, idx, t):
		if self.is_op_limit(idx):
			return False
		if t in self.kingTiles:
			return False
		# 白板代替财神
		virtual_tile = self.kingTiles[0] if t == const.DRAGON_WHITE and len(self.kingTiles) > 0 else t
		if virtual_tile >= const.BOUNDARY:
			return False
		tiles = list(filter(lambda x:x not in self.kingTiles, self.players_list[idx].tiles))
		tiles = list(map(lambda x:self.kingTiles[0] if x == const.DRAGON_WHITE else x, tiles))
		MATCH = ((-2, -1), (-1, 1), (1, 2))
		for tup in MATCH:
			if all(val+virtual_tile in tiles for val in tup):
				return True
		return False

	def can_chow_list(self, idx, tile_list):
		chow_list = list(tile_list)
		# """ 能吃 """
		if self.is_op_limit(idx):
			return False
		if len(chow_list) != 3:
			return False
		if any(t in self.kingTiles for t in tile_list):
			return False
		virtual_chow_list = list(tile_list)
		virtual_chow_list = list(map(lambda x:self.kingTiles[0] if x == const.DRAGON_WHITE else x, virtual_chow_list))
		if any(t >= const.BOUNDARY for t in virtual_chow_list):
			return False
		tiles 		= list(filter(lambda x: x not in self.kingTiles, self.players_list[idx].tiles))
		tiles 		= list(map(lambda x:self.kingTiles[0] if x == const.DRAGON_WHITE else x, tiles))
		if virtual_chow_list[1] in tiles and virtual_chow_list[2] in tiles:
			sortLis = sorted(virtual_chow_list)
			if (sortLis[2] + sortLis[0])/2 == sortLis[1] and sortLis[2] - sortLis[0] == 2:
				return True
		return False

	def can_pong(self, idx, t):
		""" 能碰 """
		if self.is_op_kingTile_limit(idx):
			return False
		if self.pong_useful and self.is_op_times_limit(idx):
			return False

		if self.circleSameTileNum(idx, t) >= 2:
			return False
		tiles = self.players_list[idx].tiles
		if t in self.kingTiles:
			return False
		return sum([1 for i in tiles if i == t]) >= 2

	def can_exposed_kong(self, idx, t):
		""" 能明杠 """
		if self.is_op_kingTile_limit(idx):
			return False
		if self.pong_useful and self.is_op_times_limit(idx):
			return False

		if t in self.kingTiles:
			return False
		tiles = self.players_list[idx].tiles
		return tiles.count(t) == 3

	def can_continue_kong(self, idx, t):
		""" 能够补杠 """
		if t in self.kingTiles:
			return False
		player = self.players_list[idx]
		for op in player.op_r:
			if op[0] == const.OP_PONG and op[1][0] == t:
				return True
		return False

	def can_concealed_kong(self, idx, t):
		""" 能暗杠 """
		if t in self.kingTiles:
			return False
		tiles = self.players_list[idx].tiles
		return tiles.count(t) == 4

	def can_kong_wreath(self, tiles, t):
		if t in tiles and (t in const.SEASON or t in const.FLOWER):
			return True
		return False

	def can_wreath_win(self, wreaths):
		if len(wreaths) == len(const.SEASON) + len(const.FLOWER):
			return True
		return False

	def getNotifyOpList(self, idx, aid, tile):
		# notifyOpList 和 self.wait_op_info_list 必须同时操作
		# 数据结构：问询玩家，操作玩家，牌，操作类型，得分，结果，状态
		notifyOpList = [[] for i in range(self.player_num)]
		self.wait_op_info_list = []
		#胡
		if aid == const.OP_KONG_WREATH and self.can_wreath_win(self.players_list[idx].wreaths): # 8花胡
			opDict = {"idx":idx, "from":idx, "tileList":[tile,], "aid":const.OP_WREATH_WIN, "score":0, "result":[], "state":const.OP_STATE_WAIT}
			notifyOpList[idx].append(opDict)
			self.wait_op_info_list.append(opDict)
		elif aid == const.OP_EXPOSED_KONG: #直杠 抢杠胡
			# wait_for_win_list = self.getKongWinList(idx, tile)
			# self.wait_op_info_list.extend(wait_for_win_list)
			# for i in range(len(wait_for_win_list)):
			# 	dic = wait_for_win_list[i]
			# 	notifyOpList[dic["idx"]].append(dic)
			pass
		elif aid == const.OP_CONTINUE_KONG: #碰后接杠 抢杠胡
			# wait_for_win_list = self.getKongWinList(idx, tile)
			# self.wait_op_info_list.extend(wait_for_win_list)
			# for i in range(len(wait_for_win_list)):
			# 	dic = wait_for_win_list[i]
			# 	notifyOpList[dic["idx"]].append(dic)
			pass
		elif aid == const.OP_CONCEALED_KONG:
			pass
		elif aid == const.OP_DISCARD:
			#胡(放炮胡)
			wait_for_win_list = self.getGiveWinList(idx, tile)
			self.wait_op_info_list.extend(wait_for_win_list)
			for i in range(len(wait_for_win_list)):
				dic = wait_for_win_list[i]
				notifyOpList[dic["idx"]].append(dic)
			#杠 碰
			for i, p in enumerate(self.players_list):
				if p and i != idx:
					if self.can_exposed_kong(i, tile):
						opDict = {"idx":i, "from":idx, "tileList":[tile,], "aid":const.OP_EXPOSED_KONG, "score":0, "result":[], "state":const.OP_STATE_WAIT}
						self.wait_op_info_list.append(opDict)
						notifyOpList[i].append(opDict)
					if self.can_pong(i, tile):
						opDict = {"idx":i, "from":idx, "tileList":[tile,], "aid":const.OP_PONG, "score":0, "result":[], "state":const.OP_STATE_WAIT}
						self.wait_op_info_list.append(opDict)
						notifyOpList[i].append(opDict)
			#吃
			nextIdx = self.nextIdx
			if self.can_chow(nextIdx, tile):
				opDict = {"idx":nextIdx, "from":idx, "tileList":[tile,], "aid":const.OP_CHOW, "score":0, "result":[], "state":const.OP_STATE_WAIT}
				self.wait_op_info_list.append(opDict)
				notifyOpList[nextIdx].append(opDict)
		return notifyOpList


	# 抢杠胡 玩家列表
	def getKongWinList(self, idx, tile):
		wait_for_win_list = []
		for i in range(self.player_num - 1):
			ask_idx = (idx+i+1)%self.player_num
			p = self.players_list[ask_idx]
			tryTiles = list(p.tiles)
			tryTiles.append(tile)
			tryTiles = sorted(tryTiles)
			DEBUG_MSG("room:{},curround:{} getKongWinList {}".format(self.roomID, self.current_round, ask_idx))
			is_win, score, result = self.can_win(tryTiles, tile, const.OP_KONG_WIN, ask_idx)
			if is_win:
				wait_for_win_list.append({"idx":ask_idx, "from":idx, "tileList":[tile,], "aid":const.OP_KONG_WIN, "score":score, "result":result, "state":const.OP_STATE_WAIT})
		return wait_for_win_list

	# 放炮胡 玩家列表
	def getGiveWinList(self, idx, tile):
		wait_for_win_list = []
		if self.win_mode == 0 or self.cur_dealer_mul < 3: # 放铳模式 庄三有效
			return  wait_for_win_list
		for i in range(self.player_num - 1):
			ask_idx = (idx+i+1)%self.player_num
			if ask_idx != self.dealer_idx and idx != self.dealer_idx: # 庄闲放铳
				continue
			p = self.players_list[ask_idx]
			tryTiles = list(p.tiles)
			tryTiles.append(tile)
			tryTiles = sorted(tryTiles)
			DEBUG_MSG("room:{},curround:{} getGiveWinList {} tile {}".format(self.roomID, self.current_round, ask_idx, tile))
			is_win, score, result = self.can_win(tryTiles, tile, const.OP_GIVE_WIN, ask_idx)
			if is_win:
				wait_for_win_list.append({"idx":ask_idx, "from":idx, "tileList":[tile,], "aid":const.OP_GIVE_WIN, "score":score, "result":result, "state":const.OP_STATE_WAIT})
		return wait_for_win_list

	def can_win(self, handTiles, finalTile, win_op, idx):
		#"""平胡 爆头 七对子 清七对"""
		#"""杠 + 飘"""
		result_list = [0] * 4
		multiply = 0
		if len(handTiles) % 3 != 2:
			DEBUG_MSG("room:{},curround:{} handTiles:{} finalTile:{} win_op:{} idx:{}".format(self.roomID, self.current_round, handTiles, finalTile, win_op, idx))
			return False, self.base_score * (2**multiply), result_list
		if win_op == const.OP_WREATH_WIN:
			DEBUG_MSG("room:{},curround:{} handTiles:{} finalTile:{} win_op:{} idx:{}".format(self.roomID, self.current_round, handTiles, finalTile, win_op, idx))
			return False, 2 ** multiply, result_list
		if win_op == const.OP_GIVE_WIN and finalTile in self.kingTiles:
			DEBUG_MSG("room:{},curround:{} handTiles:{} finalTile:{} win_op:{} idx:{}".format(self.roomID, self.current_round, handTiles, finalTile, win_op, idx))
			return False, 2 ** multiply, result_list

		p = self.players_list[idx]
		handCopyTiles = list(handTiles)
		handCopyTiles = sorted(handCopyTiles)
		kings, handTilesButKing = utility.classifyKingTiles(handCopyTiles, self.kingTiles)
		kingTilesNum = len(kings)
		# 白板代替财神
		if len(self.kingTiles) > 0:
			handTilesButKing = list(map(lambda x:self.kingTiles[0] if x == const.DRAGON_WHITE else x, handTilesButKing))
			insteadFinalTile = self.kingTiles[0] if finalTile == const.DRAGON_WHITE else finalTile
		else:
			insteadFinalTile = finalTile
		handTilesButKing = sorted(handTilesButKing)
		#2N
		is7Pair, isBaoTou, kongNum = utility.checkIs7Pair(handCopyTiles, handTilesButKing, kingTilesNum, self.kingTiles, insteadFinalTile)
		if is7Pair:
			DEBUG_MSG("room:{},curround:{} is7Pair".format(self.roomID, self.current_round))
			result_list[2] = 1 + kongNum
			multiply += result_list[2]
			if isBaoTou:
				result_list[1] = 1
				kingKongList = [1 if op == const.OP_DISCARD else -1 for op in utility.serialKingKong(p.op_r, self.kingTiles)]
				multiply += len(kingKongList) + 1
				result_list.extend(kingKongList)
				DEBUG_MSG("room:{},curround:{} is7Pair baotou".format(self.roomID, self.current_round))
				return True , self.base_score * (2 ** multiply), result_list
			elif kingTilesNum <= 0:
				result_list[3] = 1
				multiply += 1
				DEBUG_MSG("room:{},curround:{} is7Pair not baotou kingNum:0".format(self.roomID, self.current_round))
				return True, self.base_score * (2 ** multiply), result_list
			if self.bao_tou == 0:
				return True, self.base_score * (2**multiply), result_list

		#3N2
		result_list = [0] * 4
		multiply = 0
		if kingTilesNum <= 0: 	#无财神(只要满足能胡就可以胡)
			DEBUG_MSG("room:{},curround:{} kingTilesNum <= 0".format(self.roomID, self.current_round))
			if utility.meld_with_pair_need_num(handTilesButKing) <= kingTilesNum:
				result_list[0] = 1
				for op in utility.serialKingKong(p.op_r, self.kingTiles): #只有连续杠开
					if op != const.OP_DISCARD:
						result_list.append(-1)
						multiply += 1
					else:
						break
				DEBUG_MSG("room:{},curround:{} 3N2 kingNum:0".format(self.roomID, self.current_round))
				return True, self.base_score * (2**multiply), result_list
			DEBUG_MSG("room:{},curround:{} handTiles:{} finalTile:{} win_op:{} idx:{}".format(self.roomID, self.current_round, handTiles, finalTile, win_op, idx))
			return False, self.base_score * (2**multiply), result_list
		else:					#有财神(只要暴头都可以胡, 如果有财必暴，非暴头不能胡)
			# 除去暴头一对组成3N
			baotou_n3_list = []
			tryKingsNum = kingTilesNum
			if finalTile in self.kingTiles: # 最后一张 摸的是财神
				if tryKingsNum >= 2:
					tryKingsNum -= 2
					baotou_n3_list.append(list(handTilesButKing))
			else:
				tryKingsNum -= 1
				tryList = list(handTilesButKing)
				tryList.remove(insteadFinalTile) # 若最后一张不是财神 则用代替后的牌
				baotou_n3_list.append(tryList)
			DEBUG_MSG("room:{},curround:{} baotou_n3_list:{}".format(self.roomID, self.current_round, baotou_n3_list))
			#优先尝试暴头
			for tryList in baotou_n3_list:
				if utility.getMeldNeed(tryList) <= tryKingsNum:
					result_list[1] = 1
					# 连续飘杠胜利
					kingKongList = [1 if op == const.OP_DISCARD else -1 for op in utility.serialKingKong(p.op_r, self.kingTiles)]
					multiply += len(kingKongList) + 1
					result_list.extend(kingKongList)
					DEBUG_MSG("room:{},curround:{} 3N baotou".format(self.roomID, self.current_round))
					return True, self.base_score * (2 ** multiply), result_list
			else:
				DEBUG_MSG("room:{},curround:{} try not baotou".format(self.roomID, self.current_round))
				if self.bao_tou == 0 and utility.winWith3N2NeedKing(handTilesButKing) <= kingTilesNum:
					result_list[0] = 1
					# 连续杠胜利
					for op in utility.serialKingKong(p.op_r, self.kingTiles):  # 只有连续杠开
						if op != const.OP_DISCARD:
							result_list.append(-1)
							multiply += 1
						else:
							break
					DEBUG_MSG("room:{},curround:{} 3N not baotou".format(self.roomID, self.current_round))
					return True, self.base_score * (2 ** multiply), result_list
				DEBUG_MSG("room:{},curround:{} handTiles:{} finalTile:{} win_op:{} idx:{}".format(self.roomID, self.current_round, handTiles, finalTile, win_op, idx))
				return False, self.base_score * (2 ** multiply), result_list




######################################   东阳四副牌相关   ##############################################################

	def getTipsCards(self):
		selfCards = sorted(self.players_list[self.current_idx].tiles)
		selfRightShiftCards = sorted(utility.rightShiftCards(selfCards))
		preCards = utility.rightShiftCards(self.controller_discard_list)
		preCardsType = utility.getTileType(preCards)
		tips = utility.cardSubSort(selfCards)
		tips_temp = []
		for i in tips:
			cardType = utility.getTileType(i)
			if cardType == preCardsType and utility.compareTile(i, preCards):
				tips_temp.append(i)
			elif cardType > preCardsType and cardType == const.TYPE_BOMB:
				tips_temp.append(i)
		DEBUG_MSG("getTipsCards tips_temp:{}".format(tips_temp))
		return tips_temp

	def cal_score(self, idx, win_list, aid, score = 0):
		if aid == const.OP_WIN_ONE:
			self.players_list[idx].add_score(30)
		elif aid == const.OP_WIN_TWO:
			pass
		elif aid == const.OP_WIN_THREE:
			if self.players_list[win_list[1]].score % 10 == 5:
				self.players_list[win_list[0]].add_score(5)
				self.players_list[win_list[1]].add_score(-5)
			if self.players_list[idx].score % 10 == 5:
				self.players_list[win_list[0]].add_score(5)
				self.players_list[idx].add_score(-5)
			lastTilesScore = 0
			for i, p in enumerate(self.players_list):
				if p and i not in win_list:
					self.lastScoreList[i] -= 30
					p.add_score(-30)
					if p.score % 10 == 5:
						self.players_list[win_list[0]].add_score(5)
						p.add_score(-5)
					for j in p.tiles:
						lastTilesScore += utility.getDiscardScore([j,])
				p.add_score(-100)
			self.lastScoreList[win_list[0]] += lastTilesScore + 30
			self.players_list[win_list[0]].add_score(lastTilesScore)
		# elif aid == const.OP_WIN_LAST:
		# 	self.players_list[idx].add_score(-30)
		elif aid == const.OP_DISCARD:
			for i, p in enumerate(self.players_list):
				if p and i == idx:
					p.add_score(score * 3)
				elif p and i != idx:
					p.add_score(-score)
		else:
			DEBUG_MSG("room:{0},curround:{1} idx:{2} cal_score Falied".format(self.roomID, self.current_round, idx))
			return
		DEBUG_MSG("room:{0},curround:{1} idx:{2} score:{3} cal_score".format(self.roomID, self.current_round, idx, self.players_list[idx].score))
