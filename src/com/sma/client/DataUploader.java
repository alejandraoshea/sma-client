package com.sma.client;

import java.io.File;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.file.Files;

public class DataUploader {
    public static void sendData(String patientId, String jsonData) throws Exception {
        URL url = new URL("https://localhost:8080/api/patient/data");
        HttpURLConnection conn = (HttpURLConnection)url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setDoOutput(true);

        try (OutputStream os = conn.getOutputStream()) {
            os.write(jsonData.getBytes());
        }

        int responseCode = conn.getResponseCode();
        System.out.println("Server response: " + responseCode);
    }

    private static void sendFile(URL url, File file) throws Exception {
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/octet-stream");
        conn.setDoOutput(true);
        try (OutputStream os = conn.getOutputStream()) {
            os.write(Files.readAllBytes(file.toPath()));
        }
        System.out.println("Server response: " + conn.getResponseCode());
    }

    public static void sendECG(File file, Long id) throws Exception {
        URL url = new URL("https://localhost:8080/api/patient/" + id + "/ecg");
        sendFile(url, file);
    }


    public static void sendEMG(File file, Long id) throws Exception {
        URL url = new URL("https://localhost:8080/api/patient/" + id + "/emg");
        sendFile(url, file);
    }

}
