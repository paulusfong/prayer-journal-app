require "test_helper"

class MembershipTest < ActionDispatch::IntegrationTest
  test "pending member cannot see the journal or a known request" do
    sign_in_as users(:pending)

    get root_path
    assert_redirected_to pending_path

    get prayer_request_path(prayer_requests(:circle_open))
    assert_redirected_to pending_path
  end

  test "invite join creates pending membership" do
    sign_in_as users(:outsider)

    get join_path("test-invite-token")
    assert_redirected_to pending_path
    assert users(:outsider).memberships.pending.exists?(circle: circles(:our))
  end

  test "owner can approve a pending member" do
    sign_in_as users(:owner)

    patch membership_path(memberships(:pending), decision: "approve")
    assert memberships(:pending).reload.approved?
  end
end
