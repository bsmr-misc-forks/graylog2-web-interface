$(document).ready(function() {

    // Load random message.
    $(".xtrc-load-recent").on("click", function() {
        var container = $(this).parent().parent().parent();
        var subcontainer = $(".subcontainer", container);

        showSpinner(subcontainer);

        $.ajax({
            url: '/a/system/inputs/' + $(this).attr("data-node-id") + '/' + $(this).attr("data-input-id") + '/recent_message',
            success: function(data) {
                showMessage($(".xtrc-message-fields", container), data.fields, data.id);
            },
            error: function() {
                showError("There was no message received by this input in the last 24 hours. Try selecting a message manually.");
                showManualMessageSelector(subcontainer);
            },
            complete: function() {
                hideSpinner(subcontainer);
            }
        });
    });

    $(".xtrc-load-manual").on("click", function() {
        var container = $(this).parent().parent().parent();
        var subcontainer = $(".subcontainer", container);

        subcontainer.hide();

        showManualMessageSelector(subcontainer);
    });

    function showManualMessageSelector(subcontainer, container) {
        var manualSelector = $(".manual-selector", container);
        manualSelector.show();

        $(".manual-selector-form").unbind('submit').on("submit", function(event) {
            event.preventDefault();

            showSpinner(subcontainer);
            manualSelector.hide();

            var index = $("input[name=message_id]", $(this)).val();
            var messageId = $("input[name=index]", $(this)).val();

            $.ajax({
                url: '/a/messages/' + index + '/' + messageId,
                success: function(data) {
                    showMessage($(".xtrc-message-fields", container), data.fields, data.id);
                },
                error: function() {
                    showError("Could not load message. Make sure that ID and index are correct.");
                    showManualMessageSelector(subcontainer);
                },
                complete: function() {
                    hideSpinner(subcontainer);
                }
            });
        })
    }

    function showSpinner(subcontainer) {
        var spinner = "<h2><i class='icon-refresh icon-spin'></i> &nbsp;Loading message</h2>";
        subcontainer.html(spinner);
        subcontainer.show();
    }

    function hideSpinner(subcontainer) {
        subcontainer.hide();
    }

    function showMessage(dl, msg, msgId) {
        var msgContainer = dl.parent().parent();
        msgContainer.show();

        $("h2 span", msgContainer).html(msgId);

        for(var f in msg) {
            var field = f;
            var value = msg[f];
            dl.append("<dt data-field='" + field + "' data-value='" + value + "'>" + field + "</dt><dd>" + value + "&nbsp;</dd>");
        }

        // Bind links to next step.
        $("dt", msgContainer).bind("click", function() {
            var field = $(this).attr("data-field");
            var value = $(this).attr("data-value");

            $(".xtrc-select-message").remove();

            var wizard = $(".xtrc-wizard");
            $(".xtrc-wizard-field", wizard).html(field)
            $(".xtrc-wizard-example", wizard).html(value);

            $("input[name=field]", wizard).val(field)
            $("input[name=example]", wizard).val(value);
            wizard.show();
        });
    }

    // Try regular expression against example.
    $(".xtrc-try-regex").on("click", function() {
        var button = $(this);

        button.html("<i class='icon-refresh icon-spin'></i> Trying...");
        $.ajax({
            url: '/a/tools/regex_test',
            data: {
                "string":$("#xtrc-example").text(),
                "regex":$("#regex_value").val()
            },
            success: function(matchResult) {
                if(matchResult.finds) {
                    highlightMatchResult(matchResult);
                } else {
                    showWarning("Regular expression did not match.");
                }
            },
            error: function() {
                showError("Could not try regular expression. Make sure that it is valid.");
            },
            complete: function() {
                button.html("Try!");
            }
        });
    });

    // Try substring against example.
    $(".xtrc-try-substring").on("click", function() {
        var button = $(this);

        var warningText = "We were not able to run the substring extraction. Please check index boundaries.";

        button.html("<i class='icon-refresh icon-spin'></i> Trying...");
        $.ajax({
            url: '/a/tools/substring_test',
            data: {
                "string":$("#xtrc-example").text(),
                "start":$("#begin_index").val(),
                "end":$("#end_index").val()
            },
            success: function(result) {
                if(result.successful) {
                    highlightMatchResult(result);
                } else {
                    showWarning(warningText);
                }
            },
            error: function() {
                showError(warningText);
            },
            complete: function() {
                button.html("Try!");
            }
        });
    });

    function highlightMatchResult(result) {
        var example = $("#xtrc-example");
        // Set to original content first, so we can do this multiple times.
        example.html($("#xtrc-original-example").html());

        var spanStart = "<span class='xtrc-hl'>";
        var spanEnd = "</span>";

        var start = result.match.start;
        var end = result.match.end+spanStart.length;

        var exampleContent = $("<div/>").html(example.html()).text(); // ZOMG JS. this is how you unescape HTML entities.

        example.html(exampleContent.splice(start,0,spanStart).splice(end,0,spanEnd));
    }

    // Add converter button.
    $("#add-converter-fields button").on("click", function() {
        var type = $("#add-converter").val();

        $(".xtrc-converter-" + type).show();
        return false;
    });

    // Only allow alphanum and underscores as target_field values. Messages in graylog2-server will just ignore others.
    $("#target_field").on("keyup", function(event){
        var str = $(this).val();
        if(str != "") {
            var regex = /^[A-Za-z0-9_]+$/;
            if (!regex.test(str)) {
                $(this).val(str.slice(0,-1));
                return false;
            }
        }
    });

});