/// <reference path="../../typings/jquery/jquery.d.ts" />
import * as vsshare from './vsshare-client';

$(() => {
	
	const Url: string = "http://vssharestg.azurewebsites.net/signalr";
	const HubName: string = "listen";
	
	const Token: string = "5a5f9efb-2776-47dc-af59-322f3705c921";
	
	var client = new vsshare.VSShareClient(Url, HubName);
	client.startConnection(Token);
	
	// for debug
	window["_client"] = client;
});

