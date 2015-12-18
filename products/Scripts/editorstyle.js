/// <reference path="typings/jquery/jquery.d.ts" />
$(function () {
    $("#editor-white").on("click", function () {
        $("#editor-style").attr("href", "/Content/VSWhite.css");
    });

    $("#editor-black").on("click", function () {
        $("#editor-style").attr("href", "/Content/VSBlack.css");
    });

    $("#editor-pronama").on("click", function () {
        $("#editor-style").attr("href", "/Content/VSPronama.css");
    });
});
//# sourceMappingURL=editorstyle.js.map
