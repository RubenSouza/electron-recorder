const {app, BrowserWindow, ipcMain , Menu, globalShortcut, shell, dialog} = require('electron')
const path = require('path')
const os = require('os')
const fs = require('fs')
const Store = require('./Store')
const dirName = path.join(os.homedir(),'music', 'MyRecords')


const preferences = new Store({
    configName: "user-preferences",
    defaults:{
        destination: path.join(os.homedir(),'music', 'MyRecords')
    }
})



let destination = preferences.get("destination")
const isDev = (process.env.NODE_ENV !== undefined 
&& process.env.NODE_ENV == "development")?true:false

const isMac = process.platform === 'darwin'? true:false

function createPreferenceWindow(){
    const preferenceWindow = new BrowserWindow({
        width: isDev? 950: 500,
        resizable: isDev? true: false,
        height: 200,
        backgroundColor: "#234",
        show: false,
        icon: path.join(__dirname, "assets", "images", "iconProgram.png"),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
        
    });

    preferenceWindow.loadFile('./src/preferences/index.html')

    preferenceWindow.once("ready-to-show", ()=>{
        preferenceWindow.show()

        if(isDev){
            preferenceWindow.webContents.openDevTools()
        }

        preferenceWindow.webContents.send("dest-path-update", destination)
       
    })

}

function createWindow(){
    const win = new BrowserWindow({
        width: isDev? 950: 500,
        resizable: isDev? true: false,
        height: 300,
        backgroundColor: "#234",
        show: false,
        icon: path.join(__dirname, "assets", "images", "iconProgram.png"),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
        
    });
win.loadFile('./src/mainWindow/index.html')
    if(isDev){
        win.webContents.openDevTools()
    }

win.once("ready-to-show", ()=>{
    win.show()
    //Verifica se não existe
    if (!fs.existsSync(dirName)){
    //Efetua a criação do diretório
    fs.mkdirSync(dirName);
}
   
})


const menuTemplate = [
    {   
        label: "Recorder",
        submenu: [
            {
                label: "Preferences", click: ()=>{createPreferenceWindow()}
            },
            {
                label: "Open destination Folder", click: ()=>{shell.openPath(destination)}
            }]
    },
    {
        label: 'Window',
        submenu: [
            isMac? {role: "close"}: {role: "quit"}
        ]
    }
    
];

const menu = Menu.buildFromTemplate(menuTemplate);
Menu.setApplicationMenu(menu)


}




app.whenReady().then(()=>{
    createWindow();
    // console.log(os.cpus()[0].model)

})


app.on('window-all-closed', ()=>{
    console.log("All windows closeds")
    if(!isMac){
        app.quit();
    }
})

app.on("activate", ()=>{

if(BrowserWindow.getAllWindows().length === 0){
    createWindow()
}
})


ipcMain.on("save_buffer", (event, buffer)=>{
    const filePath = path.join(destination, `${Date.now()}`)
    fs.writeFileSync(`${filePath}.webm`, buffer)
    
    // stringify
})

ipcMain.handle("show-dialog", async(event)=>{
    const result = await dialog.showOpenDialog({properties:['openDirectory']})
    const dirPath = result.filePaths[0];
    preferences.set("destination", dirPath)
    destination = preferences.get("destination")

    return destination
})
