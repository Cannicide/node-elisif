const MessageComponent = require('./MessageComponent');

class SelectMenuComponent extends MessageComponent {
  
    constructor(client, data) {

        super(client, data);

        this.selected = data.data.values;
        this.message.selected = this.selected;
      
    }
  
    //Index within row, relative to the start of the row; always 0 for select menus
    rowIndex = 0;

    get max() {
        return this.asComponent().max_values;
    }

    get min() {
        return this.asComponent().min_values;
    }

    get options() {
        return this.asComponent().options;
    }

    getOptionByValue(value) {
        return this.options.find(option => option.value == value);
    }

    get placeholder() {
        return this.asComponent().placeholder;
    }
  
}

module.exports = SelectMenuComponent;