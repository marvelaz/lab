# Sample Data

Place your CSV test files in this directory for testing the lab reservation system.

## Expected CSV Format

The CSV should contain the following columns:
- ID: Unique reservation identifier
- Device: Equipment name/identifier
- Lab Region: Laboratory location or zone
- Start Date: Reservation start date (YYYY-MM-DD format)
- End Date: Reservation end date (YYYY-MM-DD format)
- Requested by: User name or identifier
- Status: Reservation status (new, acknowledged, resolved, cancelled)

## Usage

1. Copy your CSV file to this directory
2. Open the lab reservation system in your browser
3. Upload the CSV file using the file upload interface
4. Test the statistics with different timeframes

## Note

Only reservations with "resolved" status will be included in statistics calculations.