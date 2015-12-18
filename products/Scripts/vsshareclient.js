/// <reference path="../../typings/jquery/jquery.d.ts" />
/// <reference path="../../typings/signalr/signalr.d.ts" />
$(function () {
    var connection = $.hubConnection();
    connection.url = "http://vssharestg.azurewebsites.net/signalr"
    var codeHub = connection.createHubProxy('listen');
    var editor = ace.edit("code");
    editor.session.setMode("ace/mode/csharp");
    editor.setReadOnly(true);
    editor.setOption("maxLines", 
        (window.innerHeight - document.getElementsByClassName("navbar navbar-inverse navbar-fixed-top")[0].clientHeight) / editor.renderer.layerConfig.lineHeight) - 3;
    var doc = editor.session.doc;
    var Range = ace.require("./range").Range;
    
    connection.error(function () {
        alert('Failed to Load hub.');
    });

    function enc(text) {
        return text.replace(/[ <>&"]/g, function (c) {
            return { " ": "&nbsp;", "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c];
        });
    }

    function replaceLine(lineText, row, lineLength) {
        doc.replace({start:{row:row, column:0}, end:{row:(row + lineLength - 1), column:doc.getLine(row + lineLength - 1).length}}, lineText);
    }

    function insertLine(lineText, row) {
        doc.insertFullLines(row, doc.$split(lineText));
    }

    function removeLines(startRow, lineLength) {
        doc.removeLines(startRow, startRow + lineLength - 1);
    }



    codeHub.on("UpdateCode", function (codeData) {
        console.log(codeData);
        var html = "";
        if (codeData.deldata != null) {
            // deleteする
            var data = codeData.deldata;
            if (data.start == -1) {
                // すべて削除
                removeLines(0, doc.getLength());
            } else {
                removeLines(data.start, data.length);
            }
        }

        if (codeData.adddata != null) {
            // appendする
            var line = codeData.adddata;
            var lineNum = line.pos==-1?doc.getLength():line.pos;
            
            insertLine(line.text, lineNum);
            if(line.isMod){
                var range = Range.fromPoints({row:lineNum, column:0}, {row:lineNum, column:0});
                editor.session.addMarker(range, "modified-line");
            }
        }
    });

    codeHub.on("UpdateBuildStatus", function (status) {
        // Appendするのがよさそう
        var eventTitle = "Build ";
        var messageType = "info";
        switch (status.type) {
            case 1 /* Fail */:
                messageType = "danger";
                eventTitle += "Failed";
                break;
            case 2 /* Success */:
                messageType = "success";
                eventTitle += "Success";
                break;
            case 0 /* Begin */:
                eventTitle += "Begin";
                break;
        }

        eventTitle = "<strong class='build-result'>" + eventTitle + "</strong><br>";

        var message = "";
        message += "<strong>Project: </strong>" + status.project + "<br>";
        message += "<strong>Project Config: </strong>" + status.projconf + "<br>";
        message += "<strong>Solution Config: </strong>" + status.solutionconf + "<br>";
        message += "<strong>Platform: </strong>" + status.platform;

        $.growl({
            title: eventTitle,
            message: message
        }, {
            type: messageType
        });
        console.log(eventTitle);
    });

    codeHub.on("UpdateBroadcastStatus", function (status) {
        var statusTarget = $("#broadcast-status");
        if (status.isBroadcasting) {
            if (!statusTarget.hasClass("online")) {
                statusTarget.addClass("online");
                statusTarget.html("ONLINE");
            }
        } else {
            if (statusTarget.hasClass("online")) {
                statusTarget.removeClass("online");
                statusTarget.html("OFFLINE");
            }
        }

        var target = $("#code");
        if (status.isBlackout) {
            if (!target.hasClass("blackout")) {
                target.addClass("blackout");
                target.html("現在、配信者が配信スクリーンを暗転させています");
            }
        } else {
            if (target.hasClass("blackout")) {
                target.removeClass("blackout");
            }
        }
    });

    codeHub.on('UpdateViewerStatus', function (active, total) {
        $("#viewer-count").html(active.toString());
        $("#totalview-count").html(total.toString());
    });

    codeHub.on('UpdateDocumentStatus', function (fileName, lang) {
        $("#lang").html(enc(lang));
        $("#filename").html(enc(fileName));
    });

    $.extend({
        startConnection: function (token) {
            var deferred = $.Deferred();

            connection.start().done(function () {
                codeHub.invoke('Authorize', {token:token}).done(function (result) {
                    if (result) {
                        codeHub.invoke("RequestData");
                        deferred.resolve();
                    } else {
                        deferred.reject("Login Failed");
                    }
                }).fail(function (ex) {
                    deferred.reject("Login method ivoking failed.");
                });
            }).fail(function () {
                deferred.reject("Connection failed.");
            });

            return deferred.promise();
        }
    });
});
//# sourceMappingURL=codereceiver.js.map
//# sourceMappingURL=vsshareclient.js.map
