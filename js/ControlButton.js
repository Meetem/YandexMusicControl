export default class ControlButton {
    constructor(jqueryBtn) {
        this.btn = jqueryBtn;
        const _this = this;

        this.btn.on('click', () => _this.clicked());
        this.active = false;
        this.enabled = true;
    }

    clicked() {
        if (this.onClicked != null && typeof (this.onClicked) === 'function') {
            this.onClicked();
        }
    }

    setEnabled(v) {
        this.enabled = v;

        if (v){
            this.btn.removeClass('disabled');
            //this.btn.css('display', '');
        }
        else{
            this.btn.addClass('disabled');
            //this.btn.css('display', 'none');
        }
    }

    setVisible(v) {
        this.visible = v;

        if (v){
            this.btn.css('display', '');
        }
        else{
            this.btn.css('display', 'none');
        }
    }

    isVisible(){
        return this.visible;
    }

    isEnabled(){
        return this.enabled;
    }

    isActive(){
        return this.active;
    }

    setActive(v){
        this.active = v;

        if(v)
            this.btn.addClass('active');
        else
            this.btn.removeClass('active');
    }
}