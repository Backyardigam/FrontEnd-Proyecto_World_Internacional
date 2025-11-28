import { Services } from '../src/modules/service/services/service.service.ts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { scheduler } from 'timers/promises';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    console.log('Starting verification...');
    console.log('ImageKit Config:', {
        // baseURL: process.env.IMAGEKIT_URL_ENDPOINT,
        // publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY ? '***' + process.env.IMAGEKIT_PRIVATE_KEY.slice(-4) : 'MISSING',
    });

    const bobPath = path.join(__dirname, '../bob.jpg');
    const manzanaPath = path.join(__dirname, '../manzana.png');

    if (!fs.existsSync(bobPath) || !fs.existsSync(manzanaPath)) {
        console.error('Test images not found!');
        process.exit(1);
    }

    const bobBuffer = fs.readFileSync(bobPath);
    const manzanaBuffer = fs.readFileSync(manzanaPath);

    const files = [
        {
            fieldname: 'background',
            originalname: 'bob.jpg',
            encoding: '7bit',
            mimetype: 'image/jpeg',
            buffer: bobBuffer,
            size: bobBuffer.length,
        },
        {
            fieldname: 'galery',
            originalname: 'manzana.png',
            encoding: '7bit',
            mimetype: 'image/png',
            buffer: manzanaBuffer,
            size: manzanaBuffer.length,
        },
    ];

    const serviceData = {
        name: 'Test Service ' + Date.now(),
        cost: '100.50',
        type: 'tour',
        serviceState: 'visible',
        compactDescription: 'A test service',
        tag: 'test;verification',
        fullDescription: 'Full description of test service',
        itinerary: 'Day 1: Test',
        recomendations: 'Bring a towel',
        additional: 'No refunds',
        schedule: [
            {
                startTrip: '17:00',
                endTrip: '13:00',
            },
        ]
    };

    try {
        console.log('Creating service with images...');
        // We need to mock the Services class or import it correctly. 
        // Since we are running with node, we can't import .ts files directly without a loader.
        // But the user said "volverlo un archivo js ayude probablemente".
        // If I use node, I can't import .ts.
        // I should use `tsx` to run the .js file if it imports .ts files.
        // Or I need to compile everything.
        // The user's seed is .js but imports .ts? Let's check seed.js again.

        const service = await Services.createService(serviceData, files);
        console.log('Service created successfully:', service);
        // console.log('Media files:', service.mediaFiles);
    } catch (error) {
        console.error('Error creating service:', error);
    }
}

main();
