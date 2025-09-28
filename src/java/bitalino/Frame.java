package java.bitalino;

/// A frame returned by BITalino.read()
//** foto de los datos del BITalino en un instante de tiempo
public class Frame {
        /// CRC4 check function result for the frame
	public int CRC;

        /// %Frame sequence number (0...15).
        /// This number is incremented by 1 on each consecutive frame, and it overflows to 0 after 15 (it is a 4-bit number).
        /// This number can be used to detect if frames were dropped while transmitting data.
        //!! = detectar si se ha perdido algún dato
	public int seq;

        /// Array of analog inputs values (0...1023 on the first 4 channels and 0...63 on the remaining channels)
	public int [] analog = new int[6];
    //! los valores de los 6 canales analógicos: ECG, EMG, ACC,....

        /// Array of digital ports states (false for low level or true for high level).
        /// On original %BITalino, the array contents are: I1 I2 I3 I4.
        /// On %BITalino (r)evolution, the array contents are: I1 I2 O1 O2.
	public int [] digital = new int[4];
    //! los estados de los puertos digitales: I/O
    //** Input/Output: entradas y salidas digitales
    //Entrada Digital I: detecta si hay voltaje alto o bajo en un pin
    //lee un estado de encendido / apagado (0 o 1)

    //Salida digital O: permite controlar algo externo: enciende/apaga un LED, motor, buzzer,...
    // si escribes 1 en el pin, LED se enciende, si escribes 0 se apaga,...

    // 0 > nivel bajo; 1 > nivel alto
    // sirve para saber si un sensor detectó algo como un botón presionadp

    //! ejemplo: int[] salidas = {0, 0, 1, 0}; // O1 = 1 → encender, O2 = 0 → apagar
    //bitalino.trigger(salidas);
    //trigger() envía los valores a los pines de salida digitales.
    //En BITalino 2, los pines O1 y O2 se usan para controlar dispositivos externos.

    //* digital[0]	I1	I1 (entrada)
    //* digital[1]	I2	I2 (entrada)
    //* digital[2]	I3	O1 (salida)
    //* digital[3]	I4	O2 (salida)


    //? bitalino (r)evolution!


    //** cada vez que leemos los datos del BITalino, obtenemos un array de Frame!

}
