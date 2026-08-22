require "test_helper"

class AuthenticationTest < ActionDispatch::IntegrationTest
  test "GET magic link does not create a session" do
    raw = users(:member).issue_magic_link

    get magic_signin_path(raw)

    assert_response :success
    assert_select "button", /Sign in/
    get root_path
    assert_redirected_to new_session_path
  end

  test "POST magic link signs in and second POST fails" do
    raw = users(:member).issue_magic_link

    post magic_signin_path(raw)
    follow_redirect!
    get root_path
    assert_response :success

    post magic_signin_path(raw)
    assert_redirected_to new_session_path
  end

  test "unknown email still says check your email and does not create a user" do
    assert_no_difference -> { User.count } do
      post session_path, params: { email_address: "ghost@example.com" }
    end
    assert_redirected_to new_session_path
    follow_redirect!
    assert_match(/Check your email/, flash[:notice])
  end

  test "first confirmed user becomes owner of the circle" do
    [ PrayerMark, PrayerNote, RequestUpdate, RequestGrant, PrayerRequest, Membership, Invite, MagicLink, Circle ].each(&:delete_all)

    post session_path, params: { email_address: "first@example.com" }
    user = User.find_by!(email_address: "first@example.com")
    user.magic_links.delete_all
    raw = user.issue_magic_link

    post magic_signin_path(raw)
    user.reload
    assert user.owner_of?(Circle.first)
    assert_equal 1, Circle.count
  end
end
