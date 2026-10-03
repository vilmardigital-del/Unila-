package com.unila.vistorias

import android.annotation.SuppressLint
import android.content.Intent
import android.graphics.Bitmap
import android.net.ConnectivityManager
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.webkit.ConsoleMessage
import android.webkit.DownloadListener
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ProgressBar
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout

class MainActivity : AppCompatActivity() {

    companion object {
        // Change this URL to your deployed production app URL if hosted on a custom domain
        const val APP_URL = "https://ais-pre-ideaum4mdcxkcv2rdxeti3-78367879056.us-east1.run.app"
    }

    private lateinit var webView: WebView
    private lateinit var swipeRefresh: SwipeRefreshLayout
    private lateinit var progressBar: ProgressBar
    private lateinit var offlineBanner: LinearLayout
    private lateinit var offlineFallbackContainer: LinearLayout
    private lateinit var btnRetry: Button

    private var networkCallback: ConnectivityManager.NetworkCallback? = null
    private var isPageLoadedSuccessfully = false
    private var filePathCallback: ValueCallback<Array<Uri>>? = null

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        swipeRefresh = findViewById(R.id.swipeRefresh)
        progressBar = findViewById(R.id.progressBar)
        offlineBanner = findViewById(R.id.offlineBanner)
        offlineFallbackContainer = findViewById(R.id.offlineFallbackContainer)
        btnRetry = findViewById(R.id.btnRetry)

        setupWebView()
        setupSwipeRefresh()
        setupBackNavigation()
        setupRetryButton()
        monitorNetwork()

        loadApplication()
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true
        settings.setSupportZoom(false)

        // Offline caching configuration
        updateCacheMode()

        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                progressBar.visibility = View.VISIBLE
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                progressBar.visibility = View.GONE
                swipeRefresh.isRefreshing = false
                isPageLoadedSuccessfully = true
                offlineFallbackContainer.visibility = View.GONE
                webView.visibility = View.VISIBLE
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                // Only handle main frame navigation errors
                if (request?.isForMainFrame == true) {
                    progressBar.visibility = View.GONE
                    swipeRefresh.isRefreshing = false

                    if (!isPageLoadedSuccessfully) {
                        webView.visibility = View.GONE
                        offlineFallbackContainer.visibility = View.VISIBLE
                    }
                }
            }

            override fun shouldOverrideUrlLoading(
                view: WebView?,
                request: WebResourceRequest?
            ): Boolean {
                val url = request?.url?.toString() ?: return false
                // Keep internal app navigations inside the WebView
                if (url.startsWith("http://") || url.startsWith("https://")) {
                    return false
                }
                // External intents (tel, mailto, etc.)
                return try {
                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                    startActivity(intent)
                    true
                } catch (e: Exception) {
                    false
                }
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                if (newProgress < 100) {
                    progressBar.visibility = View.VISIBLE
                    progressBar.progress = newProgress
                } else {
                    progressBar.visibility = View.GONE
                }
            }

            override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                return super.onConsoleMessage(consoleMessage)
            }
        }

        // Handle PDF and file downloads gracefully
        webView.setDownloadListener(DownloadListener { url, _, _, _, _ ->
            try {
                val intent = Intent(Intent.ACTION_VIEW)
                intent.data = Uri.parse(url)
                startActivity(intent)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        })
    }

    private fun updateCacheMode() {
        val isOnline = NetworkUtils.isOnline(this)
        if (isOnline) {
            webView.settings.cacheMode = WebSettings.LOAD_DEFAULT
            offlineBanner.visibility = View.GONE
        } else {
            // Use cached resources when offline so all inspections and forms continue working
            webView.settings.cacheMode = WebSettings.LOAD_CACHE_ELSE_NETWORK
            offlineBanner.visibility = View.VISIBLE
        }
    }

    private fun setupSwipeRefresh() {
        swipeRefresh.setColorSchemeResources(R.color.purple_primary, R.color.emerald_online)
        swipeRefresh.setOnRefreshListener {
            updateCacheMode()
            webView.reload()
        }
    }

    private fun setupBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    finish()
                }
            }
        })
    }

    private fun setupRetryButton() {
        btnRetry.setOnClickListener {
            offlineFallbackContainer.visibility = View.GONE
            progressBar.visibility = View.VISIBLE
            loadApplication()
        }
    }

    private fun monitorNetwork() {
        networkCallback = NetworkUtils.registerNetworkCallback(
            this,
            onNetworkAvailable = {
                runOnUiThread {
                    updateCacheMode()
                    if (!isPageLoadedSuccessfully) {
                        loadApplication()
                    }
                }
            },
            onNetworkLost = {
                runOnUiThread {
                    updateCacheMode()
                }
            }
        )
    }

    private fun loadApplication() {
        updateCacheMode()
        webView.loadUrl(APP_URL)
    }

    override fun onDestroy() {
        super.onDestroy()
        NetworkUtils.unregisterNetworkCallback(this, networkCallback)
        webView.destroy()
    }
}
