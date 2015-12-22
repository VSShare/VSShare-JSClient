/// <reference path="../../typings/vsshare/typings/vsshare/vsshare.d.ts" />
/// <reference path="../../typings/goldenlayout/goldenlayout.d.ts" />
'use strict';

import Session from './session';

export default class Room {
	private _sessions: { [id: string]: Session; } = {};

	private _viewCount: number;
	private _visitorCount: number;
	private _myLayout: GoldenLayout;
	private _containers: { [id: string]: any; } = {};

	constructor() {
		this._myLayout = new GoldenLayout({ content: [{
				type: 'row',
				content: []}], settings: {showPopoutIcon: false}}, $('#golden-layout'));
		this._myLayout.registerComponent('file', function(container, state) {
			container.getElement().html(`<pre class="code" id="code-${state.id}"></pre>`);
			state.self._containers[state.id] = container;
			//container.tab.elements[0].title = state.filename
			state.session.setEditor(container.getElement()[0]);
		});
		this._myLayout.init();

	}

	appendSession(item: AppendSessionNotification) {
		var id = item.id;
		var filename= item.filename;
		var type = item.type;
		var owner = item.owner_name;
		if(this._sessions[id]){
			console.error(`Room already contains session id: ${id}`);
		}
		this._sessions[id] = new Session(id, filename, type, owner);
		var component = {
            type: 'component',
            componentName: "file",
            title: this.getShortFileName(filename),
            componentState: { id: id, filename: filename, session: this._sessions[id], self: this}
        };		
        this._myLayout.root.contentItems[0].addChild(component);
	}

	removeSession(item: RemoveSessionRequest) {
		var id = item.id;
		this._sessions[id].close();
		delete this._sessions[id];
		this._containers[id].close();
        delete this._containers[id];
	}

	updateRoomStatus(item: UpdateBroadcastStatusNotification) {
		this._viewCount = item.view;
		this._visitorCount = item.visitor;
		this.updateRoomStatusView();
	}

	private updateRoomStatusView() {
		document.getElementById('viewer-count').innerHTML = this._viewCount.toString();
		document.getElementById('totalview-count').innerHTML = this._visitorCount.toString();
	}
	
	updateViewSize(){
		var gl = document.getElementById("golden-layout");
		this._myLayout.updateSize(gl.clientWidth, gl.clientHeight);
	}

	updateSessionInfo(item: UpdateSessionInfoRequest) {
		var session = this._sessions[item.id];
		if (session == null) {
			console.error(`Room doesn't contain session id: ${item.id}`);
			return;
		}
		session.updateSessionInfo(item);
		this._containers[item.id].setTitle(this.getShortFileName(item.filename));
	}
	
	updateSessionContent(item: UpdateSessionContentRequest) {
		this._sessions[item.id].updateContent(item);
	}

	updateSessionCursor(item: UpdateSessionCursorRequest) {
		this._sessions[item.id].updateCursor(item);
		
	}
	
	private getShortFileName(filename) {
		return filename?filename.split(/\/|\\/).pop():"";
	}
	
	getSessionCount(): number{
		return Object.keys(this._sessions).length;
	}
}
