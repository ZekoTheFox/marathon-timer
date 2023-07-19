# marathon-timer
it puts a timer overlay on your stream, which counts down.
the timer can be extended by viewers doing certain things. (e.g. donating, subscribing, etc.)

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

<br><br>

[<sub>created by zeko</sub>](https://github.com/ZekoTheFox)
