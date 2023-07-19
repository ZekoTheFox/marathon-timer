# marathon-timer
it puts a timer overlay on your stream, which counts down.
the timer can be extended by viewers doing certain things. (e.g. donating, subscribing, etc.)

## installation

1. edit your current overlay
2. add a custom widget via *Static / Custom* > *Custom widget*

![adding custom widget](https://github.com/ZekoTheFox/marathon-timer/assets/41507889/8f16a0fa-2b16-4283-b9f9-63e1b120d0e7)

3. under the widget's settings, press *Open Editor*

![open editor button](https://github.com/ZekoTheFox/marathon-timer/assets/41507889/ea0a00b3-7ae5-43c4-a032-58c2b1a68ff3)

4. replace the text with the corresponding content from this repo's files, then press **Done**

![editor modal](https://github.com/ZekoTheFox/marathon-timer/assets/41507889/dcc80dc4-dc3b-442c-8e93-059e52bf2684)

> **HTML** should contain `widget.html`'s content, **CSS** is `widget.css`, **JS** is `widget.js`, and **Fields** is `widget.json`. ***the "DATA" tab is not used, ignore it***

5. the settings should now display the various groups for controlling and customizing the timer.

## configuration
look at the widget's settings tab in your selected overlay

### placeholder values
specifically for the text formatting options, the following placeholders are replaced if written:
| name    | description                                        |
|---------|----------------------------------------------------|
| `%user` | the user's name as displayed by the event          |
| `%unit` | value of the event; months, bits, tip, etc.        |
| `%time` | formatted time addition in seconds (e.g. `[+35s]`) |

## can it...

### be operated through chat?
not yet, but it probably can be implemented easily if i feel like it.

### work with youtube?
yes, set the data source to `Youtube` instead of `Twitch` and it'll handle them correctly.

some things will not be supported however, such as hosting and raiding. (not implemented in youtube)

### pause if my stream goes offline?
no

### have a specific feature i want?
idk, modify it yourself or get someone else to do it for you.

<br><br>

[<sub>created by zeko</sub>](https://zeko.party)
