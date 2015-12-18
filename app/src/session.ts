/// <reference path="../../typings/vsshare/typings/vsshare/vsshare.d.ts" />
/// <reference path="../../typings/ace/ace.d.ts" />

'use strict';

export default class Session {

	_id: string;
	_filename: string;
	_type: ContentType;
	_owner: string;
	_doc: AceAjax.Document;
	_editor: AceAjax.Editor;
	Range = ace.require('./range').Range;
	
	constructor(id: string, filename: string, type: ContentType, owner: string) {
		this._id = id;
		this._filename = filename;
		this._type = type;
		this._owner = owner;
	}

	setEditor(element: HTMLElement) {
		this._editor = ace.edit(<HTMLElement>element.querySelector("#code-" + this._id));
		this._editor["_emit"] = (name:string, e: MouseEvent) => {};
		this._editor["$callKeyboardHandlers"] = (hashId:number, keyString: string, keyCode: number, e: KeyboardEvent) => {};
		this.setEditorMode(this._type);
		this._editor.setReadOnly(true);
		this._editor.setOption("maxLines", (element.clientHeight) / this._editor.renderer.layerConfig.lineHeight);
		this._doc = this._editor.session.doc;
	}

	replaceLines(lines: Line[], row: number, lineLength: number) {
		var range = new this.Range(row, 0, row + lineLength - 1, this._doc.getLine(row + lineLength - 1).length);
		var linesStr = [];
		for(var i=0; i<lines.length; i++){
			linesStr.push(lines[i].text);
		}
        this._doc.replace(range, linesStr.join("\n"));
    }

    insertLines(lines: Line[], row: number) {
		var textlines = [];
		for(var i=0; i<lines.length; i++) {
			textlines.push(lines[i].text);
		}
        this._doc.insertFullLines(row, textlines);
    }

    removeLines(startRow: number, lineLength: number) {
        this._doc.removeLines(startRow, startRow + lineLength - 1);
    }

	dispose() {
		// 終了処理
		
	}

	updateContent(item: UpdateSessionContentRequest) {
		item.data.sort((a: UpdateContentData, b: UpdateContentData) => {
			return a.order - b.order;
		})
		item.data.forEach(d => {
			var pos = d.pos;
			switch(d.type){
				case UpdateType.Append:
					pos = this._doc.getLength();
				case UpdateType.Insert:
					this.insertLines(d.data, pos);
					break;
				case UpdateType.Delete:
					this.removeLines(d.pos, d.len);
					break;
				case UpdateType.Replace:
					this.replaceLines(d.data, d.pos, d.len);
					break;
				case UpdateType.ResetAll:
					this.removeLines(0, this._doc.getLength());
					break;
			}
		});
	}

	updateCursor(item: UpdateSessionCursorRequest) {
	}

	updateSessionInfo(item: UpdateSessionInfoRequest) {
		this._filename = item.filename;
		this._type = item.type;
		this.setEditorMode(item.type);
	}
	
	setEditorMode(type: ContentType){
		var mode: string;
		switch(type){
			case ContentType.CSharp:
				mode = "ace/mode/csharp";
				break;
			case ContentType.JSON:
				mode = "ace/mode/json";
				break;
			case ContentType.VB_NET:
				mode = "ace/mode/vbscript";
				break;
			case ContentType.XML:
				mode = "ace/mode/xml";
				break;
			case ContentType.PlainText:
			default:
				mode = "ace/mode/plain_text";
				break;
		}
		this._editor.session.setMode(mode);
	}
	
	close() {
		// セッションの削除
	}

}

