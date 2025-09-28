package java.bitalino;

public class BITalinoException extends Exception {
	
	private static final long serialVersionUID = 1L;

	public BITalinoException(BITalinoErrorTypes errorType) {
		super(errorType.getName());
	    code = errorType.getValue();
	}
	
	public int code;

}
