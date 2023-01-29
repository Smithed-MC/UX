import * as fs from 'fs';
import { API_APP } from './app';
import { initialize } from 'database';
async function importRoutes(dirPath) {
    let files = fs.readdirSync('dist/' + dirPath);
    for (let file of files) {
        if (fs.statSync('dist/' + dirPath + "/" + file).isDirectory()) {
            await importRoutes(dirPath + "/" + file);
        }
        else {
            const parts = file.split('.');
            const ext = parts[parts.length - 1];
            console.log("./" + dirPath + "/" + file);
            if (ext === 'js')
                await import("./" + dirPath + "/" + file);
        }
    }
}
async function listen(port) {
    await initialize();
    await importRoutes('routes');
    await API_APP.listen({ port: port, host: '127.0.0.1' });
}
if (process.env.PORT)
    await listen(Number.parseInt(process.env.PORT));
else
    await listen(9000);
