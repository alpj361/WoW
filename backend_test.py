import requests
import sys
from datetime import datetime

class SimpleAPITester:
    def __init__(self, base_url="https://gallery-letterboxd.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if response.content:
                    try:
                        json_response = response.json()
                        print(f"   Response: {str(json_response)[:100]}...")
                    except:
                        print(f"   Response: {response.text[:100]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")

            return success, response.json() if success and response.content else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test basic health check"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "",
            200
        )
        return success

    def test_events_endpoint(self):
        """Test events endpoint"""
        success, response = self.run_test(
            "Get Events",
            "GET", 
            "events",
            200
        )
        return success

    def test_create_event(self):
        """Test creating an event"""
        test_event = {
            "title": f"Test Event {datetime.now().strftime('%H%M%S')}",
            "description": "Test event for UI testing",
            "category": "music",
            "date": "2026-02-15",
            "time": "19:00",
            "location": "Test Location"
        }
        
        success, response = self.run_test(
            "Create Event",
            "POST",
            "events",
            200,
            data=test_event
        )
        return response.get('id') if success else None

def main():
    # Setup
    tester = SimpleAPITester()
    
    print("🚀 Starting Backend API Tests for WOW Events App")
    print("=" * 50)

    # Run basic tests
    if not tester.test_health_check():
        print("❌ Basic health check failed, stopping tests")
        return 1

    if not tester.test_events_endpoint():
        print("❌ Events endpoint failed")
        return 1

    event_id = tester.test_create_event()
    if not event_id:
        print("❌ Event creation failed")
        return 1
    else:
        print(f"✅ Created test event with ID: {event_id}")

    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All backend tests passed!")
        return 0
    else:
        print("⚠️  Some backend tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())