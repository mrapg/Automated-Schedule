import re
import json
from datetime import datetime

class ScheduleParser:
    """
    An enhanced class to parse, clean, and format academic schedule text
    with a user confirmation step.
    """

    def __init__(self, faculty_json: str):
        self.faculty_data = json.loads(faculty_json)

    def generate_review_text(self, parsed_data: list) -> str:
        """Generates a formatted, human-readable text schedule for review."""
        if not parsed_data:
            return "No schedule entries found matching the criteria."

        output_lines = []
        last_date = None
        for session in parsed_data:
            current_date = session["date"]
            if current_date != last_date:
                if last_date is not None:
                    output_lines.append("") # Add a blank line between days
                # Format the date header
                output_lines.append("="*50)
                output_lines.append(current_date.strftime('%A, %d %B %Y').upper())
                output_lines.append("="*50)
                last_date = current_date

            # Recreate the familiar pipe-separated format for the session line
            output_lines.append(
                f"{session.get('time_str', 'N/A')} | "
                f"{session.get('department', 'N/A')} | "
                f"{session.get('topic', 'N/A')} | "
                f"{session.get('instructor', 'N/A')} | "
                f"{session.get('venue', 'N/A')}"
            )
        
        return "\n".join(output_lines)

    def generate_json_output(self, parsed_data: list) -> str:
        """Generates the final, structured JSON output from the parsed data."""
        output_list = []
        for session in parsed_data:
            try:
                # Assuming time_str is in 'HH:MM - HH:MM' format
                start_time, end_time = [t.strip() for t in session["time_str"].split('-')]
            except (ValueError, KeyError):
                start_time, end_time = "N/A", "N/A"

            # New logic to extract specific batch
            batch = ["ALL"]  # Default value
            topic = session.get("topic", "")
            
            # Check for specific batch identifiers like (Batch A), (Batch B), etc.
            match = re.search(r'\((VI Term|I3 Batch)\s*(Batch\s*[A-D])?\)', topic, re.IGNORECASE)
            if match:
                # If a specific batch (e.g., "Batch A") is found, use it
                if match.group(2):
                    batch = [match.group(2)]
                # Otherwise, it's a general session for the term
                else:
                    batch = ["ALL"]


            json_obj = {
                "date": session["date"].strftime('%Y-%m-%d'),
                "startTime": start_time,
                "endTime": end_time,
                "department": session["department"],
                "topic": topic,
                "instructor": session["instructor"],
                "location": session["venue"],
                "batch": batch,
                "isHoliday": False,
                "isClinic": session.get("is_clinic", False)
            }
            output_list.append(json_obj)
            
        return json.dumps(output_list, indent=2)


# --- Main Execution with NEW Confirmation Step ---
if __name__ == "__main__":
    
    # This is the correctly filtered data from your PDF, based on your rules.
    # We will use this data to demonstrate the new confirmation workflow.
    manually_parsed_data = [
      {
        "date": datetime(2025, 9, 8),
        "time_str": "15:00 - 16:00",
        "department": "Forensic Medicine & Toxicology",
        "topic": "Revision -Firearm (VI Term Batch A)",
        "instructor": "Maj Ishita Manral",
        "venue": "LH Sushruta",
      },
      {
        "date": datetime(2025, 9, 12),
        "time_str": "08:00 - 09:00",
        "department": "Forensic Medicine & Toxicology",
        "topic": "Revision-asphyxia (VI Term)",
        "instructor": "Maj Antara Debbarma",
        "venue": "LH Sushruta",
      }
    ]
    
    # We instantiate the parser (faculty data is needed for potential instructor mapping)
    parser = ScheduleParser(faculty_json="{}")

    # --- STEP 1: Generate and print the text output for user review ---
    print("--- SCHEDULE FOR YOUR REVIEW ---")
    review_text = parser.generate_review_text(manually_parsed_data)
    print(review_text)
    print("\n" + "#"*40)

    # --- STEP 2: Ask for confirmation ---
    confirmation = input("--> Does this schedule look correct? (yes/no): ").lower().strip()

    # --- STEP 3: Generate JSON only if confirmed ---
    if confirmation in ['yes', 'y']:
        print("\nConfirmation received. Generating JSON output...")
        print("--- FINAL JAVASCRIPT/JSON OUTPUT ---")
        final_json = parser.generate_json_output(manually_parsed_data)
        print(final_json)
    else:
        print("\nOperation cancelled. JSON output was not generated.")
