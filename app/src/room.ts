/// <reference path="../../typings/vsshare/typings/vsshare/vsshare.d.ts" />

'use strict';

import Session from './session';

export default class Room {
	private _sessions: { [id: string]: Session; } = {};
	
	private _viewCount: number;
	private _visitorCount: number;

	constructor() {
		
		
	}

	registerSession(id: string, filename: string, type: string, owner: string) {
		
	}

	removeSession(id: string) {
		
	}
	
	updateRoomStatus(item: UpdateBroadcastStatusNotification) {
		this._viewCount = item.view;
		this._visitorCount = item.visitor;
		this.updateRoomStatusView();
	}
	
	private updateRoomStatusView() {
		// ルーム状態表示を再描画
	}
	
	updateSessionInfo(item: UpdateSessionInfoRequest) {
		var session = this._sessions[item.id];
		if (session == null) {
			console.error(`Room don't contain session id: ${item.id}`);
			return;
		}
		
		session.updateSessionInfo(item);		
	}
		
}
