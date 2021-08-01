const MessageComponent = require('./MessageComponent');
const { ButtonUtility } = require("../util/ComponentUtility");

class ButtonComponent extends MessageComponent {
  
    constructor(client, data) {
        super(client, data);
    }
  
    get label() {
      
      return this.asComponent().label;
      
    }

    get disabled() {
        
        var comp = this.asComponent();

        if (!comp) return undefined;

        return !("disabled" in comp) || !comp.disabled ? false : true;
    
    }

    get style() {
      
        var comp = this.asComponent();
        
        if (!comp) return undefined;
        
        return ButtonUtility.deconvertColor(comp.style);
    
    }

    get color() {
        return this.style;
    }
  
}

module.exports = ButtonComponent;