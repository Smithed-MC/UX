import { DocumentReference, getFirestore } from "firebase-admin/firestore";

function forLastDays(days: number): string[] {
    const date = new Date();
    const dates: string[] = []
    for (let day = 0; day < days; day++) {
        dates.push(date.toLocaleDateString().replaceAll("/", "-"))
        date.setDate(date.getDate() - 1);
    }
    return dates;
}

async function getDaysDownload(doc: DocumentReference, days: string[]): Promise<number> {
    let total = 0
    for (let day of days) {
        const dayDoc = await doc.collection("downloads").doc(day).get()

        total += await dayDoc.get('total') ?? 0

    }
    return total;
}

export async function calculateDownloads() {
    console.log('Calculating Metrics...')
    const docs = await getFirestore().collection("analytics").listDocuments()

    const past7Days = forLastDays(7);
    const past30days = forLastDays(30);
    const today = new Date().toLocaleDateString().replaceAll("/", "-");

    for (const packAnalyticDoc of docs) {
        const packDataDoc = getFirestore().collection("packs").doc(packAnalyticDoc.id)
        await handleAnalysticsForPack(packAnalyticDoc, past7Days, packDataDoc, today).catch((r) => console.error(r));
    }
}

async function handleAnalysticsForPack(packAnalyticDoc: DocumentReference<FirebaseFirestore.DocumentData>, past7Days: string[], packDataDoc: DocumentReference<FirebaseFirestore.DocumentData>, today: any) {
    const past7DayDownloads = await getDaysDownload(packAnalyticDoc, past7Days);


    const docSnapshot = await packDataDoc.get();

    const stats = docSnapshot.get('stats');
    if (stats === undefined) {
        console.log(`${docSnapshot.id} has no stats!`)
        return;
    }

    stats.downloads = {
        pastWeek: past7DayDownloads,
        total: (await packAnalyticDoc.collection('downloads').doc('total').get()).data()?.value ?? 0,
        today: (await packAnalyticDoc.collection('downloads').doc(today).get()).data()?.total ?? 0
    };

    const packCategories: string[] | undefined = docSnapshot.get('data.categories');

    if (packCategories?.find(f => f == 'Library'))
        stats.score = 0;
    else {
        const recentThreshold = 7 * 24 * 60 * 60 * 1000;
        let recentModifer = (Date.now() - (stats.updated ?? stats.added)) / recentThreshold;

        recentModifer = Math.min(recentModifer, 1);
        recentModifer = 5 * (1 - recentModifer) + 1;

        let impactModifier = 1 + (stats.downloads.today / stats.downloads.total);

        stats.score = Math.ceil((past7DayDownloads + (stats.downloads.today * 100)) * recentModifer * impactModifier);
    }

    await packDataDoc.set({
        stats: stats
    }, { merge: true });
}
