
export class LogHandler {
    logArray = [];
    vm = null;
    constructor() {
        this.logArray = [];
    }

    attachLog = (vm) => {
        this.vm = vm;
        // Partially implement `console` object
        const consoleHandle = vm.newObject();

        const logHandle = vm.newFunction("log", (...args) => this.logFunction("log", ...args));
        const infoHandle = vm.newFunction("info", (...args) => this.logFunction("info", ...args));
        const warnHandle = vm.newFunction("warn", (...args) => this.logFunction("warn", ...args));
        const errorHandle = vm.newFunction("error", (...args) => this.logFunction("error", ...args));


        vm.setProp(vm.global, "console", consoleHandle);
        vm.setProp(consoleHandle, "log", logHandle);
        vm.setProp(consoleHandle, "info", infoHandle);
        vm.setProp(consoleHandle, "warn", warnHandle);
        vm.setProp(consoleHandle, "error", errorHandle);


        consoleHandle.dispose();
        logHandle.dispose();
        infoHandle.dispose();
        warnHandle.dispose();
        errorHandle.dispose();
    }

    logFunction = (type, ...args) => {
        this.logArray.push({
            type,
            timestamp: new Date().toISOString(),
            data: args.map(this.vm.dump)
        });
    }

    getLog = () => {
        // console.log("getLog: logArray[] = ", this.logArray);
        return [...this.logArray];
    }

    clearLog = () => {
        this.logArray = [];
    }
}
