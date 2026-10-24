# PlateForward 🍃

### Connecting Surplus Food with Communities in Need

PlateForward is a web-based food donation platform that connects restaurants, food businesses, and organisations with NGOs and community volunteers to help reduce food waste and make surplus food available to people in need.

**PlateForward acts as a mediator.** Donors provide the food, NGOs collect it directly from the donor's location, and the original donor confirms the collection through the platform.

## 🌟 Key Features

- Create and publish surplus food donations.
- View available food donations and their details.
- Claim available donations for collection.
- Track donation statuses.
- Allow the original donor to confirm collection by an NGO.
- Maintain an activity history for donation events.
- Search, filter, and sort donation listings.
- View donation statistics and community impact.
- Export donation records as a CSV file.
- Responsive interface with light and dark themes.

## 🔄 How It Works

1. **Donor lists food:** A restaurant or organisation enters the food details, quantity, expiry time, and pickup address.
2. **NGO claims food:** An NGO or volunteer views the listing and claims the donation.
3. **NGO collects food:** The NGO travels to the donor's location and collects the food directly.
4. **Donor confirms collection:** Only the original donor should be authorised to confirm that the food has been collected.
5. **Platform records the update:** PlateForward updates the donation status and records the relevant activity.

PlateForward does not transport or deliver food itself.

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Backend | Serverless API routes |
| Hosting and deployment | Vercel |
| Database | PostgreSQL hosted on Neon |
| Database connectivity | Neon serverless driver |
| Version control | Git and GitHub |

## 🗄️ Database

PlateForward uses Neon PostgreSQL to store application data.

The main tables are:

- **`donations`** — stores food details, quantities, expiry times, pickup addresses, donor information, statuses, and ownership information.
- **`donation_events`** — stores donation activity history, including listing creation and status changes.

The database schema is provided in `schema.sql`.

### Database Setup

1. Create or select a PostgreSQL database in Neon.
2. Open the Neon SQL Editor.
3. Run the SQL statements from `schema.sql`.
4. Copy the appropriate Neon connection string.
5. Add it to Vercel as the `DATABASE_URL` environment variable.
6. Ensure the environment variable points to the same database where the schema was executed.

**Important:** Updating `schema.sql` in GitHub does not automatically update the live database. Run required schema changes in Neon separately.

## 🚀 Deployment

PlateForward is deployed using Vercel.

To deploy your own copy:

1. Fork or clone the GitHub repository.
2. Configure a Neon PostgreSQL database.
3. Run `schema.sql` in the Neon SQL Editor.
4. Import the repository into Vercel.
5. Configure `DATABASE_URL` in the Vercel project settings.
6. Deploy the application and test the donation workflow.

After changing environment variables, redeploy the application so the updated configuration is applied.

## 🔐 Donation Ownership and Security

The application is designed to restrict collection confirmation to the original donor.

- Donor ownership must be verified by the backend.
- A visitor should not be able to confirm collection simply by changing frontend controls or sending a direct API request.
- Private ownership tokens must never be exposed in public donation listings or activity logs.
- Browser-stored tokens can be lost when browser data is cleared or a different device is used.
- NGO identity verification requires an additional authentication and authorisation system.

A production deployment should also include appropriate input validation, rate limiting, and secure account management.

## 🌱 Project Goal

PlateForward aims to reduce avoidable food waste by connecting food donors with organisations that can collect and redistribute surplus food.

By improving coordination between donors and NGOs, the platform seeks to make food donation more organised, transparent, and accessible.

## 👥 Contribution

Contributions from teammates are welcome.

1. Clone the repository.
2. Create a separate branch for your changes.
3. Test your changes locally.
4. Submit a pull request for review.

Never commit database passwords, private connection strings, API keys, or other sensitive credentials.

## 📄 License

Add a suitable open-source license to the repository if you intend to distribute the project under one.

---

**PlateForward — Share Surplus. Reduce Waste. Support Communities.**
