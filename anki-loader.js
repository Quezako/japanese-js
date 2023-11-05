$(function () {
    if (window.matchMedia("only screen and (max-width: 760px)").matches) {
        console.log('mobile');
        $.getScript("https://cdn.jsdelivr.net/gh/quezako/anki@main/quezako.js")
            .fail(function (jqxhr, settings, exception) {
                console.log(jqxhr, settings, exception);
            });
    } else {
        console.log('PC');
        $.getScript("http://localhost/anki/quezako.js")
            .fail(function () {
                $.getScript("https://cdn.jsdelivr.net/gh/quezako/anki@main/quezako.js")
                    .fail(function (jqxhr, settings, exception) {
                        console.log(jqxhr, settings, exception);
                    });
            });
    }
});