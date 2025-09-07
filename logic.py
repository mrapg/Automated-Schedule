import re
import json
from datetime import datetime

class ScheduleParser:
    """
    An enhanced class to parse, clean, and format academic schedule text
    with a user confirmation step and intelligent instructor name resolution.
    """

    def __init__(self, faculty_json: str):
        self.faculty_data = json.loads(faculty_json)
        # Create a flat lookup map for instructor initials for efficiency
        self.instructor_lookup = {}
        for dept, faculty_list in self.faculty_data.items():
            for faculty in faculty_list:
                if 'abbreviation' in faculty and faculty['abbreviation']:
                    full_name = f"{faculty.get('rank', '')} {faculty.get('name', '')}".strip()
                    self.instructor_lookup[faculty['abbreviation']] = full_name

    def _resolve_instructor(self, instructor_str: str) -> str:
        """
        Resolves instructor initials to full names based on rules.
        - If > 3 instructors, returns original initials string.
        - If <= 3 instructors, returns full names.
        """
        if not instructor_str or instructor_str == "N/A":
            return "N/A"
            
        # Split by comma or space and filter out empty strings
        initials = [i.strip() for i in re.split(r'[,\s]+', instructor_str) if i]

        if len(initials) > 3:
            return ", ".join(initials)  # Return original initials, but nicely formatted

        # Resolve initials to full names
        resolved_names = [self.instructor_lookup.get(initial, initial) for initial in initials]
        return ", ".join(resolved_names)

    def generate_review_text(self, parsed_data: list) -> str:
        """
        Generates a formatted, human-readable text schedule for review,
        including specific batch information and resolved instructor names.
        """
        if not parsed_data:
            return "No schedule entries found matching the criteria."

        output_lines = []
        last_date = None
        for session in parsed_data:
            current_date = session["date"]
            if current_date != last_date:
                if last_date is not None:
                    output_lines.append("")
                output_lines.append("="*50)
                output_lines.append(current_date.strftime('%A, %d %B %Y').upper())
                output_lines.append("="*50)
                last_date = current_date
            
            topic = session.get("topic", "")
            batch_display = "(All Batches)"
            match = re.search(r'\((VI Term|I3 Batch)\s*(Batch\s*[A-D])?\)', topic, re.IGNORECASE)
            if match and match.group(2):
                batch_display = f"({match.group(2)})"
            
            # Use the resolver method for display
            resolved_instructor = self._resolve_instructor(session.get("instructor", "N/A"))

            output_lines.append(
                f"{session.get('time_str', 'N/A')} | "
                f"{session.get('department', 'N/A')} | "
                f"{topic} | "
                f"{resolved_instructor} | "
                f"{session.get('venue', 'N/A')} | "
                f"{batch_display}"
            )
        
        return "\n".join(output_lines)

    def generate_json_output(self, parsed_data: list) -> str:
        """
        Generates the final, structured JSON output from the parsed data,
        with conditionally resolved instructor names.
        """
        output_list = []
        for session in parsed_data:
            try:
                start_time, end_time = [t.strip() for t in session["time_str"].split('-')]
            except (ValueError, KeyError):
                start_time, end_time = "N/A", "N/A"

            batch = ["ALL"]
            topic = session.get("topic", "")
            
            match = re.search(r'\((VI Term|I3 Batch)\s*(Batch\s*[A-D])?\)', topic, re.IGNORECASE)
            if match:
                if match.group(2):
                    batch = [match.group(2)]
                else:
                    batch = ["ALL"]
            
            # Use the resolver method for the final JSON data
            resolved_instructor = self._resolve_instructor(session.get("instructor", "N/A"))

            json_obj = {
                "date": session["date"].strftime('%Y-%m-%d'),
                "startTime": start_time,
                "endTime": end_time,
                "department": session["department"],
                "topic": topic,
                "instructor": resolved_instructor,
                "location": session["venue"],
                "batch": batch,
                "isHoliday": False,
                "isClinic": session.get("is_clinic", False)
            }
            output_list.append(json_obj)
            
        return json.dumps(output_list, indent=2)

# --- Main Execution with NEW Confirmation Step ---
if __name__ == "__main__":
    
    # NOTE: Using faculty.json content to make the example runnable and demonstrate the new logic.
    faculty_content = """
    {
      "Forensic Medicine & Toxicology": [
        {"rank": "Maj", "name": "Ishita Manral", "abbreviation": "IM"},
        {"rank": "Maj", "name": "Antara Debbarma", "abbreviation": "AD"}
      ],
      "Ophthalmology": [
        {"rank": "Brig", "name": "K Shyamsundar", "abbreviation": "KS"}, 
        {"rank": "Brig", "name": "Sandeep Shankar", "abbreviation": "BSS"}, 
        {"rank": "Col", "name": "Bhupesh Bhatkoti", "abbreviation": "BB"}, 
        {"rank": "Col", "name": "Sankalp Seth", "abbreviation": "SS"}
      ]
    }
    """

    # Example data now uses initials, as it would after raw parsing.
    manually_parsed_data = [
      {
        "date": datetime(2025, 9, 8),
        "time_str": "15:00 - 16:00",
        "department": "Forensic Medicine & Toxicology",
        "topic": "Revision - Firearm (VI Term Batch A)",
        "instructor": "IM", # Single instructor
        "venue": "LH Sushruta",
      },
      {
        "date": datetime(2025, 9, 12),
        "time_str": "08:00 - 09:00",
        "department": "Forensic Medicine & Toxicology",
        "topic": "Revision - Asphyxia (VI Term)",
        "instructor": "IM, AD", # Two instructors
        "venue": "LH Sushruta",
      },
      {
        "date": datetime(2025, 9, 15),
        "time_str": "10:00 - 13:00",
        "department": "Ophthalmology",
        "topic": "Clinics (OP 7.3)",
        "instructor": "KS, BSS, BB, SS", # Four instructors
        "venue": "Service Eye OPD/OT",
      }
    ]
    
    parser = ScheduleParser(faculty_json=faculty_content)

    print("--- SCHEDULE FOR YOUR REVIEW ---")
    review_text = parser.generate_review_text(manually_parsed_data)
    print(review_text)
    print("\n" + "#"*40)

    confirmation = input("--> Does this schedule look correct? (yes/no): ").lower().strip()

    if confirmation in ['yes', 'y']:
        print("\nConfirmation received. Generating JSON output...")
        print("--- FINAL JAVASCRIPT/JSON OUTPUT ---")
        final_json = parser.generate_json_output(manually_parsed_data)
        print(final_json)
    else:
        print("\nOperation cancelled. JSON output was not generated.")
