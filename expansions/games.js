// A collection of commands involving games for entertainment purposes! Can be linked to the Points System expansion to reward victory.


const fetch = require("node-fetch");
const Command = require("../index").Command;
const rainbowLine = "https://cdn.discordapp.com/attachments/728320173009797190/861743129241976852/rainbow_line.gif";

function givePoints(client, userID, points) {

    if (!client.expansions.has("points")) return;

    //Else awards points:
    //(Functionality not yet existent; points system is not yet implemented)

} 

//Game class
class Game {

    //Array of running games and their players, in [{name:"game name",player:"user id"}] format
    static running = [];

    //User object of player of the game
    player;

    //User object of opponent of the game, if there is one
    opponent;

    //Score of player in current game
    #score = 0;

    /**
     * Returns the player's score target/goal (e.g. the score needed to win).
     */
    target;

    //The number of times super.render() has been called.
    #render_calls = 0;

    //Channel object the game is being played in
    channel;

    //The client object
    client;

    constructor(player, opponent, channel) {
        this.player = player;
        this.opponent = opponent ? opponent : false;
        this.channel = channel;
        this.client = channel.client;

        var gameName = this.constructor.name;

        if (!this.isRunning) Game.running.push({name: gameName, player: this.player.id})
        else this.alreadyRunning = true;
    }

    /**
     * Returns whether or not the player is currently running this specific game (e.g. a Trivia game).
     * If true when the Game is being constructed, this is a duplicate game (another game is already running).
     * If false when the Game is being played/rendered, the game has prematurely ended.
     */
    get isRunning() {
        var gameName = this.constructor.name;
        return Game.running.find(v => v.name == gameName && v.player == this.player.id);
    }

    /**
     * Returns the player's current score in the game.
     */
    get score() {
        return this.#score;
    }

    /**
     * Adds a specified amount to the player's score.
     * @param {Number} score - The amount to add to the player's score.
     */
    addScore(score) {
        this.#score += score;
    }

    /**
     * Overwrite this method with code to reward the user for winning the game, and any other code to end the game.
     * Call super.reward(points) to reward the user with a specified number of points, if the Points System expansion is enabled.
     * super.reward(points) also automatically calls this.endGame().
     * @param {*} points 
     * @returns 
     */
    reward(points) {

        this.endGame();

        if (!this.client.expansions.has("points")) return false;

        givePoints(this.client, this.player.id, points);
        return true;
    }

    /**
     * Overwrite this method with code to execute when the game ends.
     * Call super.endGame() to officially end the game and remove this game session from the running games array.
     */
    endGame() {
        while (this.isRunning) {
            var index = Game.running.findIndex(v => v.name == this.isRunning.name && v.player == this.isRunning.player);
            if (index > -1) Game.running.splice(index, 1);
            else break;
        }

        return true;
    }

    /**
     * Generates the URL of a random cat image. Useful as a placeholder image in various games.
     * @returns A Promise containing the URL of a random cat image.
     */
    placeholderImage() {
        return fetch("https://aws.random.cat/meow").then(res => res.json()).then(res => res.file);
    }

    /**
     * A simple utility method to return a random number within the specified range. Necessary for many different games.
     * @param {*} min - The minimum number of the range.
     * @param {*} max - The maximum number of the range.
     * @returns Random number between min and max (both inclusive).
     */
    random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Overwrite this method with code to render the game, or in other words to send the messages containing the gameplay.
     * Call super.render(embed) to send an embed message if this is the first time super.render() has been called on this object.
     * @param {Object} embed - The settings of the embed interface to send if this is the first time super.render() has been called.
     */
    render(embed) {
        if(this.#render_calls++ == 0) {
            return this.channel.embed(embed);
        }
    }

}



// ---------------------------- GAME CLASSES ---------------------------- \\



//Trivia Game
class Trivia extends Game {

    #uri = "https://opentdb.com/api.php?amount=5&encode=base64&difficulty=";

    static SCORE_TARGET = 15;

    target = Trivia.SCORE_TARGET;

    questions = [];

    constructor(message) {
        super(message.author, false, message.channel);

        this.message = message;
    }

    get difficulty() {

        var setting = this.message.getGlobalSetting("games.trivia.difficulty");

        var difficulties = {
            easy: "easy",
            medium: "medium",
            hard: "hard"
        };

        if (setting && setting.toLowerCase() == "easier") {
            difficulties.medium = "easy";
            difficulties.hard = "medium";
        }
        else if (setting && setting.toLowerCase() == "easiest") {
            difficulties.medium = "easy";
            difficulties.hard = "easy";
        }
        
        if (this.score < this.target / 3 * 1) return difficulties.easy;
        else if (this.score < this.target / 3 * 2) return difficulties.medium;
        else return difficulties.hard;
    }

    get uri() {
        var uri = this.#uri + this.difficulty;
        var alwaysTrueFalse = this.message.getGlobalSetting("games.trivia.only_tf");

        if (alwaysTrueFalse) uri += "&type=boolean";
        return uri;
    }

    reward(points) {
        if (super.reward(points)) return `\n**+${this.target} points**`;
        else return "";
    }

    async render() {

        if (!this.isRunning) return;

        var points_message = "";

        if (this.client.expansions.has("points")) points_message = ` Earn a maximum of ${this.target} points per day by winning a trivia game! *To avoid abuse, points will only be given for a __single__ game per day.*`;

        //Message sent only when game starts:
        super.render({
            title: "Dynamic Trivia - Info",
            desc: `In Dynamic Trivia, you will be posed ${this.target} questions that get progressively harder: ${this.target / 3} easy, ${this.target / 3} medium, and ${this.target / 3} hard by default. Some will be multiple choice, some will be true/false. Answer all questions correctly, in a row, to win the game! If you answer any incorrectly, you lose and must restart the game.` + points_message,
            image: rainbowLine
        });

        //Generate question, answers, and message embed:

        if (this.questions.length < 1) {
            var request = await (await fetch(this.uri)).json();
            var emotes = ["🇦", "🇧", "🇨", "🇩"];

            this.questions = request.results.map(item => {
                var answer = Buffer.from(item.correct_answer, 'base64').toString();
                var other_options = item.incorrect_answers.map(option => Buffer.from(option, 'base64').toString());
                var category = Buffer.from(item.category, 'base64').toString();
                var question = Buffer.from(item.question, 'base64').toString();
                var type = Buffer.from(item.type, 'base64').toString();

                var answer_index;
                answer = answer.length > 25 ? answer.substring(0, 22) + "..." : answer;

                /* 
                    Response structure:
                    {
                        category: question category,
                        question: question,
                        answer: correct answer to question,
                        options: all choices including correct answer,
                        type: "multiple" (mc) or "boolean" (t/f)
                    }
                */
                var response = {category,question,answer,type};

                //Multiple choice
                if (type.toLowerCase() == "multiple") {

                    answer_index = this.random(0, 3);
                    response.options = new Array(4).fill(false);

                }
                //True/false
                else {

                    answer_index = this.random(0, 1);
                    response.options = new Array(2).fill(false);

                }

                response.options[answer_index] = {
                    label: answer,
                    emoji: emotes[answer_index]
                };

                response.options.forEach((option, index) => {
                    if (option) return;
                    response.options[index] = {
                        label: other_options[0].length > 25 ? other_options[0].substring(0, 22) + "..." : other_options[0],
                        emoji: emotes[index]
                    };
                    other_options.shift();
                });

                return response;

            });
        }

        var current_data = this.questions.shift();
        var catImage = await this.placeholderImage();

        if (this.message.getGlobalSetting("debug_mode") || this.message.getGlobalSetting("games.cheat_mode")) console.log(`Answer to Trivia #${this.score + 1}: ${current_data.answer}`);

        var embed = {
            title: `Question ${this.score + 1}/${this.target}`,
            color: "9b59b6",
            fields: [
                {
                    name: "Category",
                    value: current_data.category,
                    inline: true
                },
                {
                    name: "Type",
                    value: (this.difficulty[0].toUpperCase() + this.difficulty.slice(1)) + " (" + (current_data.type == "multiple" ? "Multiple Choice" : "True / False") + ")",
                    inline: true
                },
                {
                    name: "Question",
                    value: current_data.question
                }
            ],
            thumbnail: catImage,
            footer: [this.player.username, `Dynamic Trivia`]
        };

        //Delay sending message for a few seconds:
        setTimeout(async () => {

            //Double check that the game is still running
            if (!this.isRunning) return;

            var m = await this.channel.selectMenu(embed, {
                placeholder: "Select an answer...",
                options: current_data.options
            });

            m.startMenuCollector(async menu => {

                if (menu.user.id != this.player.id) {
                    var full_command = this.message.prefix + this.message.label;
                    menu.reply("Please start your own game using `" + full_command + "` to play Dynamic Trivia!", true);
                    return;
                }

                //Double check that the game is still running
                if (!this.isRunning) return;

                m.endMenuCollector();

                var choice = menu.selected;
                var answer = current_data.answer;

                //Correct answer
                if (choice == answer) {

                    this.addScore(1);

                    //Won game
                    if (this.score == this.target) {

                        var reward = this.reward(this.target);
                        menu.delayedReply("** **", false, 4000, new this.message.interface.Embed(this.message, {
                            title: "Dynamic Trivia - Victory!",
                            color: "50E3C2", //Cyan
                            desc: `✅ You answered correctly!\n\n**🎉 You won the game!**${reward}\n** **`,
                            fields: [
                                {
                                    name: "Your Choice",
                                    value: choice
                                },
                                {
                                    name: "Answer",
                                    value: answer
                                }
                            ],
                            footer: [this.player.username, `Completed ${this.score}/${this.target}`]
                        }));
                        return;

                    }
                    //Next question
                    else {

                        menu.delayedReply("** **", false, 4000, new this.message.interface.Embed(this.message, {
                            title: "Dynamic Trivia - Correct!",
                            color: "769332", //Green
                            desc: `✅ You answered correctly!\n*Loading next question...*\n** **`,
                            fields: [
                                {
                                    name: "Your Choice",
                                    value: choice
                                },
                                {
                                    name: "Answer",
                                    value: answer
                                }
                            ],
                            footer: [this.player.username, `Completed ${this.score}/${this.target}`]
                        }));
                        return this.render();

                    }

                }
                //Incorrect answer
                else {

                    menu.delayedReply("** **", false, 4000, new this.message.interface.Embed(this.message, {
                        title: "Dynamic Trivia - Game Over...",
                        color: "D0021B", //Red
                        desc: `<:no:669928674119778304> You answered incorrectly...\n\n**😿 Game over!**\nYou correctly answered ${this.score} questions in a row.\n** **`,
                        fields: [
                            {
                                name: "Your Choice",
                                value: choice
                            },
                            {
                                name: "Answer",
                                value: answer
                            }
                        ],
                        footer: [this.player.username, `Completed ${this.score}/${this.target}`]
                    }));
                    this.endGame();
                    return;

                }

            });

        }, 5000);

    }

}



//------------------- GAME COMMANDS ------------------------\\



module.exports = {
    commands: [
        new Command({
            expansion: true,
            name: "dynamictrivia",
            desc: "Answer multiple increasingly challenging questions in a row to win this trivia game!",
            cooldown: 60,
            aliases: ["trivia", "dtrivia"]
        }, async (message) => {

            let game = new Trivia(message);

            if (game.alreadyRunning) {
                var m = await message.channel.button("You are already running a Dynamic Trivia game(s). To avoid bugs or confusion caused by duplicate games, you must end your earlier game to start a new one.", {
                    color: "red",
                    label: "End Previous Game"
                });
                
                m.startButtonCollector(async (button) => {

                    if (button.user.id != message.author.id) return;

                    m.endButtonCollector();
                    m.buttons.permDisable(button);

                    game.endGame();

                    button.reply("Your previous Dynamic Trivia game(s) has been ended. You can now start a new game!", true);

                });

                return;
            }

            game.render();

        })
    ],

    initialize(client) {

        if (!client.expansions.has("points")) return;

        //Point reward on winning trivia
        client.expansions.get("points").Config.leveling.addDefault("game_trivia", {
            points: Trivia.SCORE_TARGET,
            dailyCap: 1,
            type: "message"
        });

    }
}