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
            
        initials = [i.strip() for i in re.split(r'[,\s]+', instructor_str) if i]

        if len(initials) > 3:
            return ", ".join(initials)

        resolved_names = [self.instructor_lookup.get(initial, initial) for initial in initials]
        return ", ".join(resolved_names)

    def _resolve_batch(self, text: str) -> list:
        """
        Resolves batch information from text based on complex rules.
        """
        # Rule for combined batches (e.g., A+B, C+D)
        combined_match = re.search(r'\b([A-D])\s*\+\s*([A-D])\b', text, re.IGNORECASE)
        if combined_match:
            return [f"Batch - {combined_match.group(1).upper()} & {combined_match.group(2).upper()}"]

        # Rule for specific single batches (e.g., VI A, I3 C)
        specific_match = re.search(r'\b(VI|I3)\s+([A-D])\b', text, re.IGNORECASE)
        if specific_match:
            return [f"Batch-{specific_match.group(2).upper()}"]

        # Default rule for general term batches
        if re.search(r'\b(VI|I3|I3 VI)\b', text, re.IGNORECASE):
            return ["ALL"]
            
        # Fallback if no match
        return ["ALL"]

    def generate_review_text(self, parsed_data: list) -> str:
        """
        Generates a formatted, human-readable text schedule for review.
        """
        if not parsed_data:
            return "No schedule entries found matching the criteria."

        output_lines = []
        last_date = None
        for session in parsed_data:
            current_date = session["date"]
            if current_date != last_date:
                if last_date is not None: output_lines.append("")
                output_lines.append("="*50)
                output_lines.append(current_date.strftime('%A, %d %B %Y').upper())
                output_lines.append("="*50)
                last_date = current_date
            
            topic = session.get("topic", "")
            batch_list = self._resolve_batch(topic)
            batch_display = f"({', '.join(batch_list)})" if "ALL" not in batch_list else "(All Batches)"
            
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
        Generates the final, structured JSON output from the parsed data.
        """
        output_list = []
        for session in parsed_data:
            try:
                start_time, end_time = [t.strip() for t in session["time_str"].split('-')]
            except (ValueError, KeyError):
                start_time, end_time = "N/A", "N/A"

            topic = session.get("topic", "")
            batch = self._resolve_batch(topic)
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

# --- Main Execution ---
if __name__ == "__main__":
    
    faculty_content = """
    {
      "Forensic Medicine & Toxicology": [{"rank": "Maj", "name": "Ishita Manral", "abbreviation": "IM"}],
      "Obs & Gynae": [{"rank": "Col", "name": "Sirisha Anne", "abbreviation": "SA"}]
    }
    """

    # Example data to demonstrate all new batch rules
    manually_parsed_data = [
      {
        "date": datetime(2025, 9, 8),
        "time_str": "15:00 - 16:00",
        "department": "Forensic Medicine & Toxicology",
        "topic": "Tutorial (VI A)", # Specific Batch
        "instructor": "IM",
        "venue": "Demo Room",
      },
      {
        "date": datetime(2025, 9, 9),
        "time_str": "14:00 - 16:00",
        "department": "Obs & Gynae",
        "topic": "Clinics (C+D)", # Combined Batch
        "instructor": "SA",
        "venue": "OPD",
      },
       {
        "date": datetime(2025, 9, 10),
        "time_str": "08:00 - 09:00",
        "department": "Forensic Medicine & Toxicology",
        "topic": "Lecture (VI Term)", # General Batch
        "instructor": "IM",
        "venue": "LH Sushruta",
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
