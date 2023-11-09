import * as fs from 'fs'
dotenv.config()
import { API_APP, importRoutes, setupApp } from './app.js'
import { initialize } from 'database'
import dotenv from 'dotenv'
import { getFirestore } from 'firebase-admin/firestore'
import { calculateDownloads } from './tasks/createMetrics.js'
import { deleteTempFiles } from './tasks/deleteTempFiles.js'
import { checkIndices } from './tasks/checkIndices.js'


export type Queryable = FirebaseFirestore.Query | FirebaseFirestore.CollectionReference;


async function executeTasks(ignoreTime?: boolean) {
  console.log('Running tasks...')
  const now = new Date()
    
  if(now.getMinutes() % 60 === 30 || ignoreTime) {
    calculateDownloads()
    checkIndices();
  }

  deleteTempFiles()
}

async function listen(port: number) {
  console.log('Starting to listen on ', port)

  await setupApp()
  await API_APP.listen({ port: port, host: process.env.DOCKER ? '0.0.0.0' : '127.0.0.1' })

  executeTasks(process.env.TEST_TASKS == 'true')
  setInterval(executeTasks, 60 * 1000)
}

if (process.env.PORT)
  listen(Number.parseInt(process.env.PORT))
else
  listen(9000)
