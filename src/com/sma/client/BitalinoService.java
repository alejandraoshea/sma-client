package com.sma.client;

import bitalino.BITalino;
import bitalino.BITalinoException;
import bitalino.Frame;

public class BitalinoService {
    private BITalino bitalino;

    public BitalinoService() {
        this.bitalino = new BITalino();
    }

    public void startAcquisition(String macAddress, int[] channels, int samplingRate) {
        try {
            bitalino.open(macAddress, samplingRate);
            bitalino.start(channels);
        } catch (BITalinoException e) {
            throw new RuntimeException(e);
        } catch (Throwable e) {
            throw new RuntimeException(e);
        }
    }

    public Frame[] readSamples(int samples) throws Exception {
        return bitalino.read(samples);
    }

    public void stop() throws Exception {
        bitalino.stop();
        bitalino.close();
    }
}
