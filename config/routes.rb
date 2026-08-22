Rails.application.routes.draw do
  resource :session, only: %i[ new create destroy ]
  get  "sign-in/:token", to: "magic_signins#show", as: :magic_signin
  post "sign-in/:token", to: "magic_signins#create"
  get "join/:token", to: "joins#show", as: :join

  get "pending", to: "gates#pending", as: :pending
  get "need-invite", to: "gates#need_invite", as: :need_invite
  get "privacy", to: "pages#privacy", as: :privacy

  resource :profile, only: %i[ edit update ] do
    post :skip
  end

  resources :memberships, only: %i[ index update destroy ]
  resources :invites, only: :create

  resources :prayer_requests do
    collection do
      get :answered
    end
    resource :answer, only: %i[ create destroy ]
    resource :prayer_mark, only: %i[ create destroy ]
    resources :prayer_notes, only: %i[ create update destroy ]
    resources :request_updates, only: %i[ create destroy ]
  end

  get "up" => "rails/health#show", as: :rails_health_check

  root "prayer_requests#index"
end
