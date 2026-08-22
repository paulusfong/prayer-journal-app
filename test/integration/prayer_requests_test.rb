require "test_helper"

class PrayerRequestsTest < ActionDispatch::IntegrationTest
  setup do
    sign_in_as users(:member)
  end

  test "member sees circle requests and not another person's private request" do
    get root_path
    assert_response :success
    assert_select "h2", text: prayer_requests(:circle_open).title
    assert_select "h2", text: prayer_requests(:private_open).title, count: 0

    get prayer_request_path(prayer_requests(:private_open))
    assert_response :not_found
  end

  test "private request create sends no mail" do
    sign_in_as users(:owner)

    assert_no_enqueued_emails do
      post prayer_requests_path, params: {
        prayer_request: { title: "Secret", visibility: "private" }
      }
    end
  end

  test "circle request emails other approved members but not the author" do
    sign_in_as users(:owner)

    assert_enqueued_emails 1 do
      post prayer_requests_path, params: {
        prayer_request: { title: "Public ask", visibility: "circle" }
      }
    end
  end

  test "member can answer a circle request and author is emailed" do
    assert_enqueued_emails 1 do
      post prayer_request_answer_path(prayer_requests(:circle_open))
    end
    assert prayer_requests(:circle_open).reload.status_answered?
  end

  test "answering your own request does not email you" do
    sign_in_as users(:owner)

    assert_no_enqueued_emails do
      post prayer_request_answer_path(prayer_requests(:circle_open))
    end
  end

  test "I prayed is unique and can be untapped" do
    request = prayer_requests(:circle_open)
    assert_no_difference -> { PrayerMark.count } do
      post prayer_request_prayer_mark_path(request)
    end

    delete prayer_request_prayer_mark_path(request)
    refute request.marked_by?(users(:member))

    assert_difference -> { PrayerMark.count }, 1 do
      post prayer_request_prayer_mark_path(request)
    end
  end
end
