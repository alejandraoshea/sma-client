package bitalino;


import java.io.*;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.Vector;

import javax.bluetooth.RemoteDevice;


import java.util.concurrent.atomic.AtomicBoolean;
import java.util.logging.Level;
import java.util.logging.Logger;

public class BitalinoDemo {

    public static Frame[] frame;

    public static void main(String[] args) {

        BITalino bitalino = null;

        try {
            //MAC ADRESS
            System.out.println("Please enter BITalino MAc adress:");
            BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
            String macAddress = br.readLine();

            //SAMPLING RATE, si no es una de las 3 establecidas manda error
            int SamplingRate = 0;
            while (true) {
                System.out.println("Please enter sampling rate (10, 100 or 1000):");
                SamplingRate = Integer.parseInt(br.readLine());

                if (SamplingRate == 10 || SamplingRate == 100 || SamplingRate == 1000) {
                    break;  // válido → salimos del bucle
                } else {
                    System.out.println("Invalid sampling rate, please try again.");
                }

            }

            //INICIALIZACIÓN DEL BITALINO
            bitalino = new BITalino();
            // Code to find Devices
            //Only works on some OS
            Vector<RemoteDevice> devices = bitalino.findDevices();
            System.out.println(devices);

            bitalino.open(macAddress, SamplingRate);

            //combrobación de conexión con un bitalino
            if (bitalino.hSocket == null || bitalino.iStream == null || bitalino.oStream == null) {
                System.out.println("ERROR: BITalino not connected.");
                return;
            }
            System.out.println("BITalino connected!");

            //ELEGIR TIPO DE GRABACIÓN
            System.out.println("Enter the corresponding test:\n" +
                    "A = ecg\n" +
                    "B = emg");
            String test = br.readLine();

            //
            AtomicBoolean stopRequested = new AtomicBoolean(false);
            int recordSeconds = 0;

            if (test.equals("A")||test.equals("ecg")||test.equals("a")) {
                //crea archivo temporal (no lo guarda en el sistema solo será mandado al server)
                File file = File.createTempFile("grabaciones_bitalinoECG", ".txt");
                file.deleteOnExit();
                System.out.println("Archivo guardado en: " + file.getAbsolutePath());
                BufferedWriter writer = new BufferedWriter(new FileWriter(file, true));
                //elige el channel del ecg
                int[] channelsToAcquire = {1};
                bitalino.start(channelsToAcquire);
                //5 minutos máximo de grabación
                recordSeconds = 5*60;

                //un thread para poder manejar la obtención de datos y la parada por el usuario (cuando escribe x/X)
                Thread inputThread = new Thread(() -> {
                    try {
                        System.out.println("Press 'x' + ENTER to stop recording early.");
                        while (true) {
                            String line = br.readLine();
                            if (line != null && line.equalsIgnoreCase("x")) {
                                stopRequested.set(true);
                                System.out.println("User requested stop.");
                                break;
                            }
                        }
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                });
                inputThread.setDaemon(true);
                inputThread.start();

                //bucle principal de adquisición de la señal
                long durationMs = recordSeconds * 1000L;
                long startTime = System.currentTimeMillis();

                int blockSize = 10;
                int sampleIndex = 0;

                //mientras no haya pasado más tiempo del establecido y no se haya solicitado la parada de la grabación
                while (!stopRequested.get() &&
                        (System.currentTimeMillis() - startTime) < durationMs) {
                    frame = bitalino.read(blockSize);

                    for (Frame f : frame) {
                        long timestamp = System.currentTimeMillis();
                        int a2 = f.analog[0];

                        // Muestra canal por canal
                        System.out.println(
                                "t=" + timestamp +
                                        " | A2=" + a2
                        );
                        writer.write(sampleIndex + "," + a2);
                        writer.newLine();
                        sampleIndex++;

                    }

                }
                writer.flush();
                writer.close();

                //parar bitalino
                System.out.println("Stopping acquisition...");
                stopRequested.set(true);
                bitalino.stop();

                //TODO MANDAR EL FILE A SERVER ESTO ES UNA PRUEBA
                String carpetaDestino = "C:/Users/Carlota/OneDrive - Fundación Universitaria San Pablo CEU/CUARTO ING.B/PRIMER CUATRI/TM/intento de grabaciones con bitalino/";
                File fileFinal = new File(carpetaDestino, "grabacionECG.txt");
                //BufferedWriter w = new BufferedWriter(new FileWriter(fileFinal, true));
                Files.copy(file.toPath(), fileFinal.toPath(), StandardCopyOption.REPLACE_EXISTING);

                System.out.println("Archivo guardado en: " + file.getAbsolutePath());


            } else if (test.equals("B")||test.equals("emg")||test.equals("b")) {
                //crea archivo temporal (no lo guarda en el sistema solo será mandado al server)
                File file = File.createTempFile("grabaciones_bitalinoEMG", ".txt");
                file.deleteOnExit();
                System.out.println("Archivo guardado en: " + file.getAbsolutePath());
                BufferedWriter writer = new BufferedWriter(new FileWriter(file, true));
                //elige el channel del ecg
                int[] channelsToAcquire = {0};
                bitalino.start(channelsToAcquire);
                //1 minuto máximo de grabación (PARA UNA DEGLUCIÓN)
                recordSeconds = 60;

                Thread inputThread = new Thread(() -> {
                    try {
                        System.out.println("Press 'x' + ENTER to stop recording early.");
                        while (true) {
                            String line = br.readLine();
                            if (line != null && line.equalsIgnoreCase("x")) {
                                stopRequested.set(true);
                                System.out.println("User requested stop.");
                                break;
                            }
                        }
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                });
                inputThread.setDaemon(true);
                inputThread.start();

                // ---- Bucle principal de adquisición ----
                long durationMs = recordSeconds * 1000L;
                long startTime = System.currentTimeMillis();

                int blockSize = 10;
                int sampleIndex = 0;

                while (!stopRequested.get() &&
                        (System.currentTimeMillis() - startTime) < durationMs) {
                    frame = bitalino.read(blockSize);

                    for (Frame f : frame) {
                        long timestamp = System.currentTimeMillis();
                        int a1 = f.analog[0];

                        // Muestra canal por canal
                        System.out.println(
                                "t=" + timestamp +
                                        " | A1=" + a1
                        );
                        writer.write(sampleIndex + "," + a1);
                        writer.newLine();
                        sampleIndex++;
                    }
                }
                writer.flush();
                writer.close();

                //parar bitalino
                System.out.println("Stopping signal acquisition...");
                stopRequested.set(true);
                bitalino.stop();

                //TODO MANDAR EL FILE A SERVER ESTO ES UNA PRUEBA
                String carpetaDestino = "C:/Users/Carlota/OneDrive - Fundación Universitaria San Pablo CEU/CUARTO ING.B/PRIMER CUATRI/TM/intento de grabaciones con bitalino/";
                File fileFinal = new File(carpetaDestino, "grabacionEMG.txt");
                //BufferedWriter w = new BufferedWriter(new FileWriter(fileFinal, true));
                Files.copy(file.toPath(), fileFinal.toPath(), StandardCopyOption.REPLACE_EXISTING);

                System.out.println("Archivo guardado en: " + file.getAbsolutePath());
            }
        } catch (BITalinoException ex) {
            Logger.getLogger(BitalinoDemo.class.getName()).log(Level.SEVERE, null, ex);
        } catch (Throwable ex) {
            Logger.getLogger(BitalinoDemo.class.getName()).log(Level.SEVERE, null, ex);
        } finally {
            try {
                //close bluetooth connection
                if (bitalino != null) {
                    bitalino.close();
                }
            } catch (BITalinoException ex) {
                Logger.getLogger(BitalinoDemo.class.getName()).log(Level.SEVERE, null, ex);
            }
        }
    }
}
